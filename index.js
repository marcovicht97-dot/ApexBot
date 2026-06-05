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
// ANTI STALE API
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
// UPDATE MAP
//

async function updateMap() {

    try {

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

        const ranked = response.data.ranked;

        if (
            !ranked ||
            !ranked.current ||
            !ranked.next
        ) {

            console.log('❌ API chyba');
            return;
        }

        const currentMap =
            ranked.current.map;

        const nextMap =
            ranked.next.map;

        const currentRemaining =
            ranked.current.remainingSecs;

        if (
            typeof currentRemaining !== 'number' ||
            currentRemaining <= 0
        ) {

            console.log('❌ Špatný čas API');
            return;
        }



        lastMap = currentMap;

        const currentEnd =
            new Date(
                Date.now() +
                currentRemaining * 1000
            );

        const nextEnd =
            new Date(
                currentEnd.getTime() +
                (90 * 60 * 1000)
            );

        client.user.setActivity(
            `${currentMap} ➜ ${nextMap}`,
            {
                type: ActivityType.Watching
            }
        );

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
                text: `Apex Ranked BOT • ${new Date().toLocaleTimeString('cs-CZ')}`
            })
            .setTimestamp();

        const channel =
            await client.channels.fetch(
                CHANNEL_ID
            );

        let message;        if (
            fs.existsSync(
                MESSAGE_FILE
            )
        ) {

            const savedId =
                fs.readFileSync(
                    MESSAGE_FILE,
                    'utf8'
                ).trim();

            if (!savedId) {

                throw new Error(
                    'messageId.txt je prázdný'
                );
            }

            try {

                message =
                    await channel.messages.fetch(
                        savedId
                    );

                await message.edit({
                    embeds: [embed]
                });

                console.log(
                    '✅ Embed upraven'
                );

            } catch (err) {

                console.log(
                    '⚠️ Zpráva neexistuje — vytvářím novou'
                );

                message =
                    await channel.send({
                        embeds: [embed]
                    });

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log(
                    '🆕 Nová zpráva vytvořena'
                );
            }

        } else {

            message =
                await channel.send({
                    embeds: [embed]
                });

            fs.writeFileSync(
                MESSAGE_FILE,
                message.id
            );

            console.log(
                '🆕 První zpráva vytvořena'
            );
        }

    } catch (error) {

        console.error(
            '❌ CHYBA CELÁ:'
        );

        console.error(
            error
        );
    }
}

//
// READY
//

client.once(
    'clientReady',
    async () => {

        console.log(
            `✅ Přihlášen jako ${client.user.tag}`
        );

        await updateMap();

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
