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
        const remaining = response.data.ranked.current.remainingTimer;
        const nextMap = response.data.ranked.next.map;

        const channel = await client.channels.fetch(CHANNEL_ID);

        channel.send(
`🎮 Ranked mapa: **${rankedMap}**
⌛ Zbývá: ${remaining}

➡️ Další mapa: **${nextMap}**`
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