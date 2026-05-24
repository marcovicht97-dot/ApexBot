require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Apex Ranked BOT běží');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Web server běží');
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = '1507856465803874336';
const MESSAGE_FILE = 'messageId.txt';

// uloží poslední mapu
let lastMap = null;

async function updateMapMessage() {

    try {

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?auth=d1e8a7766be6b62ade1c00a2941bc2b3&version=2'
        );

        const ranked = response.data.ranked;

        // bezpečnostní kontrola
        if (!ranked || !ranked.current || !ranked.next) {
            console.log('API vrátilo neplatná data');
            return;
        }

        const currentMap = ranked.current.map;
        const nextMap = ranked.next.map;

        const currentRemainingSecs =
            ranked.current.remainingSecs;

        const nextDurationSecs =
            ranked.next.DurationInSecs;

        // ochrana proti bugnutému API
        if (
            lastMap === currentMap &&
            currentRemainingSecs > 7200
        ) {
            console.log('Podezřelá data API — ignoruji');
            return;
        }

        lastMap = currentMap;

        const now = new Date();

        const currentEnd =
            new Date(now.getTime() + currentRemainingSecs * 1000);

        const nextEnd =
            new Date(currentEnd.getTime() + nextDurationSecs * 1000);

        function formatTime(date) {

            return date.toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        const messageContent =
`╔══════════════╗
     🎮 RANKED MAPY
╚══════════════╝

🗺️ Aktuální mapa
➜ ${currentMap}

⏰ Končí v
➜ ${formatTime(currentEnd)}

➡️ Následující mapa
➜ ${nextMap}

🕒 Ta končí
➜ ${formatTime(nextEnd)}

🔄 Poslední aktualizace
➜ ${formatTime(now)}`;

        const channel =
            await client.channels.fetch(CHANNEL_ID);

        let message;

        // existuje uložená zpráva?
        if (fs.existsSync(MESSAGE_FILE)) {

            const messageId =
                fs.readFileSync(MESSAGE_FILE, 'utf8');

            try {

                message =
                    await channel.messages.fetch(messageId);

                await message.edit(messageContent);

                console.log('Zpráva aktualizována');

            } catch {

                // zpráva smazána
                message =
                    await channel.send(messageContent);

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log('Vytvořena nová zpráva');
            }

        } else {

            // první vytvoření
            message =
                await channel.send(messageContent);

            fs.writeFileSync(
                MESSAGE_FILE,
                message.id
            );

            console.log('První zpráva vytvořena');
        }

    } catch (error) {

        console.error('Chyba API nebo Discordu:', error.message);
    }
}

client.once('ready', async () => {

    console.log(`Přihlášen jako ${client.user.tag}`);

    // okamžitá aktualizace
    await updateMapMessage();

    // aktualizace každou minutu
    setInterval(updateMapMessage, 60 * 1000);
});

client.login(process.env.TOKEN);