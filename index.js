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
// EXPRESS KEEP ALIVE
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
// MAP STYLES
//

function getMapStyle(mapName) {

    switch (mapName) {

        case 'Olympus':
            return {
                color: '#4da6ff',
                image: 'https://i.imgur.com/U0Hwm5D.jpeg'
            };

        case 'Kings Canyon':
            return {
                color: '#3cb371',
                image: 'https://i.imgur.com/qylN5YB.jpeg'
            };

        case "World's Edge":
            return {
                color: '#ff8c42',
                image: 'https://i.imgur.com/VBHZK7A.jpeg'
            };

        case 'Broken Moon':
            return {
                color: '#b084f5',
                image: 'https://i.imgur.com/VP6FqQf.jpeg'
            };

        case 'Storm Point':
            return {
                color: '#00bfa5',
                image: 'https://i.imgur.com/ktxq8sK.jpeg'
            };

        default:
            return {
                color: '#ff4655',
                image: null
            };
    }
}

//
// FORMAT TIME
//

function formatRemaining(seconds) {

    if (seconds < 0) seconds = 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}

//
// MAIN UPDATE
//

async function updateMapMessage() {

    try {

        //
        // API REQUEST
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
        // MAP DATA
        //

        const currentMap = ranked.current.map;
        const nextMap = ranked.next.map;

        //
        // REAL TIME
        //

        let remainingSecs = ranked.current.remainingSecs;

        //
        // OCHRANA PROTI ŠPATNÝM DATŮM
        //

        if (
            typeof remainingSecs !== 'number' ||
            remainingSecs < 0 ||
            remainingSecs > 7200
        ) {
            console.log('API vrátilo špatný čas');
            return;
        }

        const remainingFormatted =
            formatRemaining(remainingSecs);

        //
        // NEXT ROTATION TIME
        //

        const nextRotation =
            new Date(Date.now() + remainingSecs * 1000);

        const nextHours =
            String(nextRotation.getHours()).padStart(2, '0');

        const nextMinutes =
            String(nextRotation.getMinutes()).padStart(2, '0');

        const endTime =
            `${nextHours}:${nextMinutes}`;

        //
        // MAP STYLE
        //

        const mapStyle =
            getMapStyle(currentMap);

        //
        // STATUS
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
            .setColor(mapStyle.color)
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
            .setThumbnail(mapStyle.image)
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

        const messageId =
            fs.readFileSync(
                MESSAGE_FILE,
                'utf8'
            ).trim();

        //
        // FETCH MESSAGE
        //

        const message =
            await channel.messages.fetch(messageId);

        //
        // EDIT MESSAGE
        //

        await message.edit({
            embeds: [embed]
        });

        console.log(
            `${currentMap} | konec ${endTime}`
        );

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
    // OKAMŽITÁ AKTUALIZACE
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
