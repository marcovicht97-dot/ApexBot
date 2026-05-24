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

app.get('/health', (req, res) => {
    res.status(200).send('OK');
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

// pokud chceš ping role:
const ROLE_ID = 'SEM_VLOZ_ID_ROLE';

const MESSAGE_FILE = 'messageId.txt';

//
// CACHE
//

let lastMessageData = '';
let previousMap = '';

//
// ANTI CRASH
//

process.on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

//
// DISCORD EVENTS
//

client.on('disconnect', () => {
    console.log('Bot odpojen');
});

client.on('reconnecting', () => {
    console.log('Bot reconnect');
});

//
// FORMAT TIME
//

function formatTime(date) {

    return date.toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

//
// MAPA -> BARVA + OBRÁZEK
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
        // API REQUEST
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

            console.log('Neplatná data API');

            return;
        }

        //
        // MAPY
        //

        const currentMap =
            ranked.current.map;

        const nextMap =
            ranked.next.map;

        const currentRemainingSecs =
            ranked.current.remainingSecs;

        const nextDurationSecs =
            ranked.next.DurationInSecs;

        //
        // ANTI BUG
        //

        if (
            currentRemainingSecs < 0 ||
            currentRemainingSecs > 7200
        ) {

            console.log('Podezřelá API data');

            return;
        }

        //
        // ČASY
        //

        const now = new Date();

        const currentEnd =
            new Date(
                now.getTime() +
                currentRemainingSecs * 1000
            );

        const nextEnd =
            new Date(
                currentEnd.getTime() +
                nextDurationSecs * 1000
            );

        //
        // STYL MAPY
        //

        const mapStyle =
            getMapStyle(currentMap);

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

        const embed = new EmbedBuilder()
            .setColor(mapStyle.color)
            .setTitle('🎮 Apex Ranked Mapy')
            .setDescription(
`🗺️ **Aktuální mapa**
➜ ${currentMap}

⏰ **Končí v**
➜ ${formatTime(currentEnd)}

➡️ **Následující mapa**
➜ ${nextMap}

🕒 **Ta končí**
➜ ${formatTime(nextEnd)}

🔄 **Poslední aktualizace**
➜ ${formatTime(now)}`
            )
            .setThumbnail(mapStyle.image)
            .setFooter({
                text: 'Apex Ranked BOT'
            })
            .setTimestamp();

        //
        // ANTI SPAM
        //

        const currentData =
            `${currentMap}-${nextMap}-${formatTime(currentEnd)}`;

        if (
            currentData === lastMessageData
        ) {

            console.log('Žádná změna');

            return;
        }

        lastMessageData = currentData;

        //
        // CHANNEL
        //

        const channel =
            await client.channels.fetch(CHANNEL_ID);

        let message;

        //
        // MESSAGE EXISTS?
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
                // EDIT MESSAGE
                //

                await message.edit({
                    embeds: [embed]
                });

                console.log('Zpráva upravena');

            } catch {

                //
                // DELETE OLD BOT MESSAGES
                //

                const messages =
                    await channel.messages.fetch({
                        limit: 20
                    });

                const botMessages =
                    messages.filter(
                        msg => msg.author.id === client.user.id
                    );

                for (const msg of botMessages.values()) {

                    try {
                        await msg.delete();
                    } catch {}
                }

                //
                // SEND NEW MESSAGE
                //

                message =
                    await channel.send({
                        embeds: [embed]
                    });

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log('Nová zpráva vytvořena');
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

            console.log('První zpráva vytvořena');
        }

        //
        // ROLE PING PŘI ZMĚNĚ MAPY
        //

        if (
            previousMap &&
            previousMap !== currentMap
        ) {

            await channel.send(
                `🔔 <@&${ROLE_ID}> Nová ranked mapa: **${currentMap}**`
            );
        }

        previousMap = currentMap;

    } catch (error) {

        console.error(
            'API/Discord chyba:',
            error.message
        );

        //
        // RETRY
        //

        setTimeout(() => {

            updateMapMessage();

        }, 15000);
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
    // AUTO UPDATE
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