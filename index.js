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
    res.send('Apex Ranked BOT běží');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Web server běží');
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
const MESSAGE_FILE = 'messageId.txt';

//
// MAP COLORS
//

function getMapStyle(mapName) {

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
// FORMAT TIME
//

function formatRemaining(seconds) {

    if (seconds < 0) seconds = 0;

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}

//
// UPDATE FUNCTION
//

async function updateMapMessage() {

    try {

        //
        // API
        //

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?auth=d1e8a7766be6b62ade1c00a2941bc2b3&version=2',
            {
                timeout: 10000,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            }
        );

        const ranked = response.data.ranked;

        if (!ranked?.current || !ranked?.next) {

            console.log('API chyba');
            return;
        }

        //
        // MAPS
        //

        const currentMap =
            ranked.current.map;

        const nextMap =
            ranked.next.map;

        //
        // TIME
        //

        let remainingSecs =
            ranked.current.remainingSecs;

        if (
            typeof remainingSecs !== 'number' ||
            remainingSecs < 0 ||
            remainingSecs > 7200
        ) {

            console.log('Špatný čas API');
            return;
        }

        //
        // END TIME
        //

        const nextRotation =
            new Date(Date.now() + remainingSecs * 1000);

        const endHours =
            String(nextRotation.getHours()).padStart(2, '0');

        const endMinutes =
            String(nextRotation.getMinutes()).padStart(2, '0');

        const endTime =
            `${endHours}:${endMinutes}`;

        //
        // STYLE
        //

        const embedColor =
            getMapStyle(currentMap);

        //
        // BOT STATUS
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

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🎮 RANKED MAPY')
            .setDescription(
`🗺️ **Aktuální mapa**
➜ ${currentMap}

⏰ **Končí v**
➜ ${endTime}

➡️ **Následující mapa**
➜ ${nextMap}

🔄 **Aktualizace**
➜ každou minutu`
            )
            .setFooter({
                text: 'Apex Ranked BOT'
            })
            .setTimestamp();

        //
        // CHANNEL
        //

        const channel =
            await client.channels.fetch(CHANNEL_ID);

        //
        // MESSAGE ID
        //

        let messageId = '';

        if (
            fs.existsSync(MESSAGE_FILE)
        ) {

            messageId =
                fs.readFileSync(
                    MESSAGE_FILE,
                    'utf8'
                ).trim();
        }

        //
        // EDIT MESSAGE
        //

        try {

            const message =
                await channel.messages.fetch(messageId);

            await message.edit({
                embeds: [embed]
            });

            console.log(
                `${currentMap} | konec ${endTime}`
            );

        } catch {

            //
            // CREATE NEW MESSAGE
            //

            const newMessage =
                await channel.send({
                    embeds: [embed]
                });

            fs.writeFileSync(
                MESSAGE_FILE,
                newMessage.id
            );

            console.log(
                'Vytvořena nová zpráva'
            );
        }

    } catch (error) {

        console.error(
            'CHYBA:',
            error.message
        );
    }
}

//
// READY
//

client.once('ready', async () => {

    console.log(
        `Přihlášen jako ${client.user.tag}`
    );

    //
    // FIRST UPDATE
    //

    await updateMapMessage();

    //
    // LIVE UPDATE
    //

    setInterval(
        updateMapMessage,
        60 * 1000
    );
});

//
// LOGIN
//

client.login(process.env.TOKEN);
