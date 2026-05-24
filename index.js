require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = '1507856465803874336';

async function sendMapRotation() {
    try {

        const response = await axios.get(
            'https://api.mozambiquehe.re/maprotation?auth=d1e8a7766be6b62ade1c00a2941bc2b3&version=2'
        );

        const rankedMap = response.data.ranked.current.map;
        const nextMap = response.data.ranked.next.map;

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

        const channel = await client.channels.fetch(CHANNEL_ID);

        channel.send(
`━━━━━━━━━━━━━━
🎮 RANKED MAPY

🗺️ Aktuální mapa:
${rankedMap}

⏰ Končí v:
${currentHours}:${currentMinutes}

➡️ Další mapa:
${nextMap}

🕒 Potom končí:
${nextHours}:${nextMinutes}

━━━━━━━━━━━━━━`
        );

    } catch (error) {
        console.error(error);
    }
}

client.once('ready', () => {
    console.log(`Přihlášen jako ${client.user.tag}`);

    sendMapRotation();

    setInterval(sendMapRotation, 60 * 60 * 1000);
});

client.login(process.env.TOKEN);