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


// =====================================================
// EXPRESS SERVER
// =====================================================

const app = express();

app.get('/', (req, res) => {
    res.send('Apex Ranked BOT ONLINE');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Web server běží');
});


// =====================================================
// DISCORD CLIENT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});


// =====================================================
// SETTINGS
// =====================================================

const CHANNEL_ID = '1507856465803874336';
const MESSAGE_FILE = './messageId.txt';


// =====================================================
// MAP COLORS
// =====================================================

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

        case 'E-District':
            return '#9b59b6';

        default:
            return '#ff4655';
    }
}


// =====================================================
// UPDATE MAP
// =====================================================

async function updateMap() {

    try {

        console.log('🔄 Načítám data z Apex API...');


        // =================================================
        // API REQUEST
        // =================================================

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?version=2',
            {
                params: {
                    auth: process.env.APEX_API_KEY
                },

                timeout: 10000,

                headers: {
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Apex-Ranked-Discord-Bot'
                }
            }
        );


        // =================================================
        // RANKED DATA
        // =================================================

        const ranked = response.data.ranked;


        if (
            !ranked ||
            !ranked.current ||
            !ranked.next
        ) {

            console.log(
                '❌ API nevrátilo správná Ranked data.'
            );

            return;
        }


        // =================================================
        // CURRENT MAP
        // =================================================

        const currentMap =
            ranked.current.map || 'Neznámá mapa';


        // =================================================
        // NEXT MAP
        // =================================================

        const nextMap =
            ranked.next.map || 'Neznámá mapa';


        // =================================================
        // DATA PŘÍMO Z API
        // =================================================

        const currentRemainingTimer =
            ranked.current.remainingTimer || null;

        const currentReadableStart =
            ranked.current.readableDate_start || null;

        const currentReadableEnd =
            ranked.current.readableDate_end || null;


        const nextRemainingTimer =
            ranked.next.remainingTimer || null;

        const nextReadableStart =
            ranked.next.readableDate_start || null;

        const nextReadableEnd =
            ranked.next.readableDate_end || null;


        // =================================================
        // KONTROLA DAT
        // =================================================

        console.log('----------------------------------------');

        console.log(
            `🗺️ Aktuální mapa: ${currentMap}`
        );

        console.log(
            `⏰ Aktuální timer: ${currentRemainingTimer}`
        );

        console.log(
            `📅 Start: ${currentReadableStart}`
        );

        console.log(
            `📅 Konec: ${currentReadableEnd}`
        );

        console.log(
            `➡️ Další mapa: ${nextMap}`
        );

        console.log(
            `⏰ Další timer: ${nextRemainingTimer}`
        );

        console.log(
            `📅 Start další: ${nextReadableStart}`
        );

        console.log(
            `📅 Konec další: ${nextReadableEnd}`
        );

        console.log('----------------------------------------');


        // =================================================
        // BOT STATUS
        // =================================================

        client.user.setActivity(
            `${currentMap} ➜ ${nextMap}`,
            {
                type: ActivityType.Watching
            }
        );


        // =================================================
        // DISCORD EMBED
        // =================================================

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
➜ **${currentMap}**

⏰ **Končí za**
➜ **${currentRemainingTimer || 'N/A'}**

📅 **Končí**
➜ **${currentReadableEnd || 'N/A'}**

➡️ **Následující mapa**
➜ **${nextMap}**

⏰ **Začíná za**
➜ **${nextRemainingTimer || 'N/A'}**

📅 **Začíná**
➜ **${nextReadableStart || 'N/A'}**

🕒 **Končí**
➜ **${nextReadableEnd || 'N/A'}`
                )

                .setFooter({
                    text: 'Apex Ranked BOT • Data přímo z Apex API'
                })

                .setTimestamp();


        // =================================================
        // DISCORD CHANNEL
        // =================================================

        const channel =
            await client.channels.fetch(
                CHANNEL_ID
            );


        if (!channel) {

            console.log(
                '❌ Discord channel nebyl nalezen.'
            );

            return;
        }


        // =================================================
        // EXISTUJÍCÍ MESSAGE
        // =================================================

        let message = null;


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


            if (savedId) {

                try {

                    message =
                        await channel.messages.fetch(
                            savedId
                        );


                    await message.edit({
                        embeds: [embed]
                    });


                    console.log(
                        '✅ Embed aktualizován.'
                    );


                } catch (error) {

                    console.log(
                        '⚠️ Původní zpráva nebyla nalezena.'
                    );

                    message = null;
                }
            }
        }


        // =================================================
        // NOVÁ MESSAGE
        // =================================================

        if (!message) {

            message =
                await channel.send({
                    embeds: [embed]
                });


            fs.writeFileSync(
                MESSAGE_FILE,
                message.id
            );


            console.log(
                '🆕 Nová zpráva vytvořena.'
            );
        }


        console.log(
            '✅ Apex data úspěšně načtena.'
        );

    } catch (error) {

        console.error(
            '❌ CHYBA PŘI NAČÍTÁNÍ APEX DAT:'
        );


        if (error.response) {

            console.error(
                'HTTP:',
                error.response.status
            );

            console.error(
                error.response.data
            );

        } else {

            console.error(
                error.message
            );
        }
    }
}


// =====================================================
// DISCORD READY
// =====================================================

client.once(
    'clientReady',
    async () => {

        console.log(
            `✅ Přihlášen jako ${client.user.tag}`
        );


        // První update ihned
        await updateMap();


        // Aktualizace každou minutu
        setInterval(
            updateMap,
            60 * 1000
        );

    }
);


// =====================================================
// ERROR HANDLING
// =====================================================

process.on(
    'unhandledRejection',
    (error) => {

        console.error(
            '❌ UNHANDLED REJECTION:'
        );

        console.error(error);

    }
);


process.on(
    'uncaughtException',
    (error) => {

        console.error(
            '❌ UNCAUGHT EXCEPTION:'
        );

        console.error(error);

    }
);


// =====================================================
// ENV CHECK
// =====================================================

if (!process.env.TOKEN) {

    console.error(
        '❌ Chybí TOKEN v .env'
    );

    process.exit(1);
}


if (!process.env.APEX_API_KEY) {

    console.error(
        '❌ Chybí APEX_API_KEY v .env'
    );

    process.exit(1);
}


// =====================================================
// LOGIN
// =====================================================

client.login(
    process.env.TOKEN
);
