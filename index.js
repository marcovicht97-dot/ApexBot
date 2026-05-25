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
// CACHE
//

let lastMap = '';
let lastRemaining = '';

//
// FORMAT TIME
//

function formatRemaining(seconds) {

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}

//
// MAP COLORS + IMAGES
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
// MAIN FUNCTION
//

async function updateMapMessage() {

    try {

        //
        // API
        //

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?auth=d1e8a7766be6b62ade1c00a2941bc2b3&version=2',
            {
                timeout: 10000
            }
        );

        const ranked = response.data.ranked;

        //
        // VALIDACE
        //

        if (
            !ranked ||
            !ranked.current ||
            !ranked.next
        ) {

            console.log('Špatná API data');

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
        // LIVE ČAS
        //

        const remainingSecs =
            ranked.current.remainingSecs;

        //
        // OCHRANA
        //

        if (
            remainingSecs < 0 ||
            remainingSecs > 7200
        ) {

            console.log('Podezřelý čas API');

            return;
        }

        //
        // FORMÁT
        //

        const remainingFormatted =
            formatRemaining(remainingSecs);

        //
        // STYL MAPY
        //

        const mapStyle =
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
            .setColor(mapStyle.color)
            .setTitle('🎮 Apex Ranked Mapy')
            .setDescription(
`🗺️ **Aktuální mapa**
➜ ${currentMap}

⏰ **Zbývá**
➜ ${remainingFormatted}

➡️ **Následující mapa**
➜ ${nextMap}

🔄 **Live aktualizace**
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

        let message;

        //
        // EXISTING MESSAGE
        //

        if (
            fs.existsSync(MESSAGE_FILE)
        ) {

            const messageId =
                fs.readFileSync(
                    MESSAGE_FILE,
                    'utf8'
                );

            try {

                message =
                    await channel.messages.fetch(messageId);

                //
                // FORCE UPDATE
                //

                await message.edit({
                    embeds: [embed]
                });

                console.log(
                    `Aktualizace: ${currentMap} (${remainingFormatted})`
                );

            } catch {

                //
                // SEND NEW
                //

                message =
                    await channel.send({
                        embeds: [embed]
                    });

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log('Nová zpráva');
            }

        } else {

            //
            // FIRST MESSAGE
            //

            message =
                await channel.send({
                    embeds: [embed]
                });

            fs.writeFileSync(
                MESSAGE_FILE,
                message.id
            );

            console.log('První zpráva');
        }

        //
        // CACHE
        //

        lastMap = currentMap;
        lastRemaining = remainingFormatted;

    } catch (error) {

        console.error(
            'Chyba:',
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