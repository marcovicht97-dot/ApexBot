const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
require("dotenv").config();

const axios = require("axios");
const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("BOT ONLINE");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Web server běží");
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = 1507856465803874336;

const MAP_IMAGES = {
    "Kings Canyon": "https://i.imgur.com/6kAkp1c.jpeg",
    "Olympus": "https://i.imgur.com/rM4Q8hK.jpeg",
    "World's Edge": "https://i.imgur.com/f0G6m5h.jpeg",
    "Storm Point": "https://i.imgur.com/lK2QmF6.jpeg",
    "Broken Moon": "https://i.imgur.com/7R6Gg5m.jpeg"
};

async function updateMap() {

    try {

        const response = await axios.get(
            "https://api.mozambiquehe.re/maprotation",
            {
                params: {
                    auth: process.env.APEX_API_KEY,
                    version: 2
                }
            }
        );

        const currentMap = response.data.ranked.current;
        const nextMap = response.data.ranked.next;

        const currentEnd = new Date(currentMap.end);

        const nextEnd = new Date(
            currentEnd.getTime() + 60 * 60 * 1000
        );

        const currentEndText = currentEnd.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const nextEndText = nextEnd.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const embed = new EmbedBuilder()
            .setColor("#00ff99")
            .setTitle("🎮 RANKED MAPY")
            .addFields(
                {
                    name: "🗺️ Aktuální mapa",
                    value: `➜ ${currentMap.map}`,
                    inline: false
                },
                {
                    name: "⏰ Končí v",
                    value: `➜ ${currentEndText}`,
                    inline: false
                },
                {
                    name: "➡️ Následující mapa",
                    value: `➜ ${nextMap.map}`,
                    inline: false
                },
                {
                    name: "🕒 Ta končí",
                    value: `➜ ${nextEndText}`,
                    inline: false
                }
            )
            .setImage(MAP_IMAGES[currentMap.map] || null)
            .setFooter({
                text: `Apex Ranked BOT • dnes v ${new Date().toLocaleTimeString("cs-CZ", {
                    hour: "2-digit",
                    minute: "2-digit"
                })}`
            });

        const channel = await client.channels.fetch(CHANNEL_ID);

        let messageId = null;

        if (fs.existsSync("messageId.txt")) {
            messageId = fs.readFileSync("messageId.txt", "utf8");
        }

        let message;

        try {

            if (!messageId) throw new Error("Žádné ID");

            message = await channel.messages.fetch(messageId);

            await message.edit({
                embeds: [embed]
            });

            console.log("✅ Zpráva aktualizována");

        } catch (err) {

            console.log("⚠️ Původní zpráva nenalezena, vytvářím novou...");

            const newMessage = await channel.send({
                embeds: [embed]
            });

            fs.writeFileSync("messageId.txt", newMessage.id);

            console.log("✅ Nová zpráva vytvořena a ID uloženo");
        }

    } catch (error) {

        console.log("❌ CHYBA:");
        console.log(error.message);
    }
}

client.once("ready", async () => {

    console.log(`✅ Přihlášen jako ${client.user.tag}`);

    await updateMap();

    setInterval(updateMap, 60000);
});

client.login(process.env.TOKEN);
