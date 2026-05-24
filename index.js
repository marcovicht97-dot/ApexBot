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

        await channel.send(
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
➜ ${nextHours}:${nextMinutes}`
        );

        // čeká přesně do změny mapy
        setTimeout(sendMapRotation, currentRemaining * 1000);

    } catch (error) {
        console.error(error);

        // když API spadne, zkusí to znovu za 5 minut
        setTimeout(sendMapRotation, 5 * 60 * 1000);
    }
}

client.once('ready', () => {
    console.log(`Přihlášen jako ${client.user.tag}`);

    sendMapRotation();
});

client.login(process.env.TOKEN);