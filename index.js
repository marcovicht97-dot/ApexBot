require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = '1507856465803874336';
const MESSAGE_FILE = 'messageId.txt';

async function updateMapMessage() {

    try {

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?auth=d1e8a7766be6b62ade1c00a2941bc2b3&version=2'
        );

        const ranked = response.data.ranked;

        const currentMap = ranked.current.map;
        const nextMap = ranked.next.map;

        // čas do konce aktuální mapy
        const currentRemainingSecs =
            ranked.current.remainingSecs;

        // délka další mapy
        const nextDurationSecs =
            ranked.next.DurationInSecs;

        // aktuální čas
        const now = new Date();

        // konec aktuální mapy
        const currentEnd =
            new Date(now.getTime() + currentRemainingSecs * 1000);

        // konec další mapy
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
➜ ${formatTime(nextEnd)}`;

        const channel =
            await client.channels.fetch(CHANNEL_ID);

        let message;

        // jestli už zpráva existuje
        if (fs.existsSync(MESSAGE_FILE)) {

            const messageId =
                fs.readFileSync(MESSAGE_FILE, 'utf8');

            try {

                message =
                    await channel.messages.fetch(messageId);

                await message.edit(messageContent);

                console.log('Zpráva aktualizována');

            } catch {

                // když zpráva neexistuje
                message =
                    await channel.send(messageContent);

                fs.writeFileSync(
                    MESSAGE_FILE,
                    message.id
                );

                console.log('Vytvořena nová zpráva');
            }

        } else {

            // první vytvoření zprávy
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

    // první aktualizace
    await updateMapMessage();

    // aktualizace každou minutu
    setInterval(updateMapMessage, 60 * 1000);
});

client.login(process.env.TOKEN);