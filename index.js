async function updateMap() {

    try {

        console.log("🔄 UPDATE:", new Date().toLocaleString("cs-CZ"));

        const response = await axios.get(
            "https://api.mozambiquehe.re/maprotation?version=2",
            {
                params: {
                    auth: process.env.APEX_API_KEY
                },
                timeout: 15000
            }
        );

        console.log("📦 API DATA:");
        console.log(JSON.stringify(response.data, null, 2));

        let ranked = null;

        if (response.data?.ranked) {
            ranked = response.data.ranked;
        }

        if (response.data?.battle_royale?.ranked) {
            ranked = response.data.battle_royale.ranked;
        }

        if (!ranked) {
            console.log("❌ Apex API nevrátilo ranked data");
            return;
        }

        const currentMap = ranked.current?.map || "Neznámá";
        const nextMap = ranked.next?.map || "Neznámá";

        const currentEnd = ranked.current?.end
            ? new Date(ranked.current.end * 1000)
            : new Date();

        const nextEnd = ranked.next?.end
            ? new Date(ranked.next.end * 1000)
            : new Date();

        const currentTime = currentEnd.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const nextTime = nextEnd.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const channel = await client.channels.fetch(CHANNEL_ID);

        let messageId = null;

        if (fs.existsSync("messageId.txt")) {
            messageId = fs.readFileSync("messageId.txt", "utf8").trim();
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
                text: "Apex Ranked BOT"
            })
            .setTimestamp();

        if (messageId) {

            try {

                console.log("✏️ Edituji zprávu:", messageId);

                const oldMessage =
                    await channel.messages.fetch(messageId);

                await oldMessage.edit({
                    embeds: [embed]
                });

                console.log("✅ Zpráva aktualizována");

            } catch (err) {

                console.log("⚠️ Stará zpráva nenalezena");
                console.log(err.message);

                const newMessage = await channel.send({
                    embeds: [embed]
                });

                fs.writeFileSync(
                    "messageId.txt",
                    newMessage.id
                );

                console.log("✅ Vytvořena nová zpráva");
            }

        } else {

            const newMessage = await channel.send({
                embeds: [embed]
            });

            fs.writeFileSync(
                "messageId.txt",
                newMessage.id
            );

            console.log("✅ První zpráva vytvořena");
        }

    } catch (error) {

        console.log("❌ CHYBA UPDATE");

        if (error.response) {

            console.log("STATUS:",
                error.response.status);

            console.log("DATA:",
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {

            console.log(error.message);
        }
    }
}
