require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = '1507856465803874336';
const MESSAGE_FILE = 'messageId.txt';

let lastMap = '';

async function updateMapMessage() {

    try {

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?auth=d1e8a7766be6b62ade1c00a2941bc2b3&version=2'
        );

        const rankedMap =
            response.data.ranked.current.map;

        const nextMap =
            response.data.ranked.next.map;

        const currentRemaining =
            response.data.ranked.current.remainingSecs;

        const nextRemaining =
            response.data.ranked.next.DurationInSecs;

        const currentEnd = new Date(
            Date.now() + currentRemaining * 1000
        );

        const nextEnd = new Date(
            currentEnd.getTime() + nextRemaining * 1000
        );

        const currentHours = currentEnd
            .getHours()
            .toString()
            .padStart(2, '0');

        const currentMinutes = currentEnd
            .getMinutes()
            .toString()
            .padStart(2, '0');

        const nextHours = nextEnd
            .getHours()
            .toString()
            .padStart(2, '0');

        const nextMinutes = nextEnd
            .getMinutes()
            .toString()
            .padStart(2, '0');

        const messageContent =
`╔══════════════╗
     🎮 RANKED MAPY
╚══════════════╝

🗺️ Aktuální mapa
➜ ${rankedMap}

⏰ Končí v
➜ ${currentHours}:${currentMinutes}

➡️ Následující mapa
➜ ${nextMap}

🕒 Ta končí
➜ ${nextHours}:${nextMinutes}`;

        const channel =
            await client.channels.fetch(CHANNEL_ID);

        let message;

        // pokud mapa zůstala stejná
        // nic nepřepisuje
        if (lastMap === rankedMap) {

            console.log('Mapa beze změny');

            return;
        }

        lastMap = rankedMap;

        // existuje uložená zpráva?
        if (fs.existsSync(MESSAGE_FILE)) {

            const messageId =
                fs.readFileSync(MESSAGE_FILE, 'utf8');

            try {

                message =
                    await channel.messages.fetch(messageId);

                await message.edit(messageContent);

                console.log('Zpráva upravena');

            } catch {

                message =
                    await channel.send(messageContent);

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log('Vytvořena nová zpráva');
            }

        } else {

            message =
                await channel.send(messageContent);

            fs.writeFileSync(
                MESSAGE_FILE,
                message.id
            );

            console.log('První zpráva vytvořena');
        }

    } catch (error) {

        console.error(error);
    }
}

client.once('ready', async () => {

    console.log(`Přihlášen jako ${client.user.tag}`);

    // první spuštění
    await updateMapMessage();

    // kontrola každou minutu
    setInterval(updateMapMessage, 60 * 1000);
});

client.login(process.env.TOKEN);