require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActivityType,
    EmbedBuilder
} = require('discord.js');

const axios = require('axios');
const fs = require('fs');
const express = require('express');

//
// EXPRESS SERVER
// ANTI RAILWAY SLEEP
//

const app = express();

app.get('/', (req, res) => {
    res.send('BOT ONLINE');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Web server běží');
});

//
// DISCORD CLIENT
//

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

//
// SETTINGS
//

const CHANNEL_ID = '1507856465803874336';
const MESSAGE_FILE = './messageId.txt';

//
// CACHE PROTI STARÝM DATŮM
//

let lastMap = null;

//
// BARVY MAP
//

function getMapColor(mapName) {

    switch (mapName) {

        case 'Olympus':
            return '#4da6ff';

        case 'Kings Canyon':
            return '#3cb371';

        case "World's Edge":
            return '#ff8c42';

        case 'Broken Moon':
            return '#b084f5';

        case 'Storm Point':
            return '#00bfa5';

        default:
            return '#ff4655';
    }
}

//
// FORMÁT ČASU
//

function formatTime(date) {

    return date.toLocaleTimeString(
        'cs-CZ',
        {
            hour: '2-digit',
            minute: '2-digit'
        }
    );
}

//
// HLAVNÍ UPDATE
//

async function updateMap() {

    try {

        //
        // API REQUEST
        //
const response = await axios.get(
    'https://api.mozambiquehe.re/maprotation?version=2',
    {
        params: {
            auth: process.env.APEX_API_KEY
        },
        timeout: 10000,
        headers: {
            'Cache-Control': 'no-cache'
        }
    }
);

        const ranked =
            response.data.ranked;

        //
        // VALIDACE
        //

        if (
            !ranked ||
            !ranked.current ||
            !ranked.next
        ) {

            console.log('❌ API chyba');
            return;
        }

        //
        // MAPY
        //

        const currentMap =
            ranked.current.map;

        const nextMap =
            ranked.next.map;

        //
        // ČAS
        //

        const currentRemaining =
            ranked.current.remainingSecs;

        //
        // VALIDACE ČASU
        //

        if (
            typeof currentRemaining !== 'number' ||
            currentRemaining <= 0
        ) {

            console.log('❌ Špatný čas API');
            return;
        }

        //
        // OCHRANA PROTI STARÝM DATŮM
        //

        if (
            lastMap === currentMap &&
            currentRemaining > 5000
        ) {

            console.log(
                '⚠️ API vrátilo stará data'
            );

            return;
        }

        lastMap = currentMap;

        //
        // KONEC AKTUÁLNÍ MAPY
        //

        const currentEnd =
            new Date(
                Date.now() +
                currentRemaining * 1000
            );

        //
        // DALŠÍ MAPA
        // ranked = 1h 30m
        //

        const nextEnd =
            new Date(
                currentEnd.getTime() +
                (90 * 60 * 1000)
            );

        //
        // STATUS BOTA
        //

        client.user.setActivity(
            `${currentMap} ➜ ${nextMap}`,
            {
                type: ActivityType.Watching
            }
        );

        //
        // EMBED
        //

        const embed =
            new EmbedBuilder()
            .setColor(
                getMapColor(currentMap)
            )
            .setTitle(
                '🎮 RANKED MAPY'
            )
            .setDescription(
`🗺️ **Aktuální mapa**
➜ ${currentMap}

⏰ **Končí v**
➜ ${formatTime(currentEnd)}

➡️ **Následující mapa**
➜ ${nextMap}

🕒 **Ta končí**
➜ ${formatTime(nextEnd)}`
            )
            .setFooter({
                text: 'Apex Ranked BOT'
            })
            .setTimestamp();

        //
        // CHANNEL
        //

        const channel =
            await client.channels.fetch(
                CHANNEL_ID
            );

        let message;

        //
        // EXISTUJE MESSAGE FILE?
        //

        if (
            fs.existsSync(
                MESSAGE_FILE
            )
        ) {

            const savedId =
                fs.readFileSync(
                    MESSAGE_FILE,
                    'utf8'
                ).trim();

            //
            // OCHRANA PROTI PRÁZDNÉMU ID
            //

            if (!savedId) {

                throw new Error(
                    'messageId.txt je prázdný'
                );
            }

            try {

                //
                // FETCH STARÉ ZPRÁVY
                //

                message =
                    await channel.messages.fetch(
                        savedId
                    );

                //
                // EDITACE
                //

                await message.edit({
                    embeds: [embed]
                });

                console.log(
                    '✅ Embed upraven'
                );

            } catch (err) {

                //
                // KDYŽ ZPRÁVA NEEXISTUJE
                //

                console.log(
                    '⚠️ Zpráva neexistuje — vytvářím novou'
                );

                message =
                    await channel.send({
                        embeds: [embed]
                    });

                //
                // ULOŽ NOVÉ ID
                //

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log(
                    '🆕 Nová zpráva vytvořena'
                );
            }

        } else {

            //
            // PRVNÍ ZPRÁVA
            //

            message =
                await channel.send({
                    embeds: [embed]
                });

            //
            // ULOŽENÍ ID
            //

            fs.writeFileSync(
                MESSAGE_FILE,
                message.id
            );

            console.log(
                '🆕 První zpráva vytvořena'
            );
        }

    } catch (error) {

console.error('❌ CHYBA CELÁ:');
console.error(error);
        
}
}

//
// READY
//

client.once(
    'ready',
    async () => {

        console.log(
            `✅ Přihlášen jako ${client.user.tag}`
        );

        //
        // OKAMŽITÝ UPDATE
        //

        await updateMap();

        //
        // UPDATE KAŽDOU MINUTU
        //

        setInterval(
            updateMap,
            60 * 1000
        );
    }
);

//
// ANTI CRASH
//

process.on(
    'unhandledRejection',
    console.error
);

process.on(
    'uncaughtException',
    console.error
);

//
// LOGIN
//

client.login(
    process.env.TOKEN
);
