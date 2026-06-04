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

const CHANNEL_ID = "1507856465803874336";

async function updateMap() {

    try {

        const response = await axios.get(
            "https://api.mozambiquehe.re/maprotation?version=2",
            {
                params: {
                    auth: process.env.APEX_API_KEY
                }
            }
        );

        const ranked = response.data.ranked;

        if (!ranked || !ranked.current || !ranked.next) {
            console.log("❌ Apex API nevrátilo ranked data");
            return;
        }

        const currentMap = ranked.current.map || "Neznámá mapa";
        const nextMap = ranked.next.map || "Neznámá mapa";

        const remainingSecs = ranked.current.remainingSecs || 0;

        const currentEnd = new Date(
            Date.now() + remainingSecs * 1000
        );

        const nextEnd = new Date(
            currentEnd.getTime() + (90 * 60 * 1000)
        );

        const currentTime = currentEnd.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const nextTime = nextEnd.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const channel = await client.channels.fetch(CHANNEL_ID);

        let messageId = null;

        if (fs.existsSync("messageId.txt")) {
            messageId = fs.readFileSync(
                "messageId.txt",
                "utf8"
            ).trim();
        }

        const embed = new EmbedBuilder()
            .setColor("#00ff88")
            .setTitle("🗺️ RANKED MAPY")
            .setDescription(
`🗺️ **Aktuální mapa**
➡️ ${currentMap}

⏰ **Končí v**
➡️ ${currentTime}

➡️ **Následující mapa**
➡️ ${nextMap}

🕒 **Ta končí**
➡️ ${nextTime}`
            )
            .setFooter({
                text: `Apex Ranked BOT • ${new Date().toLocaleTimeString("cs-CZ")}`
            })
            .setTimestamp();

        try {

            if (messageId) {

                const oldMessage =
                    await channel.messages.fetch(messageId);

                await oldMessage.edit({
                    embeds: [embed]
                });

                console.log("✅ Zpráva aktualizována");

            } else {

                const newMessage =
                    await channel.send({
                        embeds: [embed]
                    });

                fs.writeFileSync(
                    "messageId.txt",
                    newMessage.id
                );

                console.log("✅ Nová zpráva vytvořena");
            }

        } catch (error) {

            console.log("⚠️ Původní zpráva nenalezena");

            const newMessage =
                await channel.send({
                    embeds: [embed]
                });

            fs.writeFileSync(
                "messageId.txt",
                newMessage.id
            );

            console.log("✅ Náhradní zpráva vytvořena");
        }

    } catch (error) {

        console.log("❌ CHYBA:");
        console.log(error.message);
    }
}

client.once("clientReady", async () => {

    console.log(
        `✅ Přihlášen jako ${client.user.tag}`
    );

    await updateMap();

    setInterval(
        updateMap,
        60000
    );
});

client.login(process.env.TOKEN);
