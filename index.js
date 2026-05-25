const fs = require("fs");

const MESSAGE_ID_FILE = "./messageId.txt";

async function updateMap() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data[0];

    const current = data.current;
    const next = data.next;

    const currentEnd = new Date(current.end * 1000);
    const nextEnd = new Date(next.end * 1000);

    const formatTime = (date) =>
      date.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      });

    const embed = new EmbedBuilder()
      .setTitle("🗺️ RANKED MAPY")
      .setColor("#00ff99")
      .setDescription(
        `## 🗺️ Aktuální mapa\n➡️ ${current.map}\n\n` +
        `## ⏰ Končí v\n➡️ ${formatTime(currentEnd)}\n\n` +
        `## ▶️ Následující mapa\n➡️ ${next.map}\n\n` +
        `## ⏰ Ta končí\n➡️ ${formatTime(nextEnd)}`
      )
      .setTimestamp();

    const channel = await client.channels.fetch(CHANNEL_ID);

    let message;

    // POKUS O NAČTENÍ STARÉ ZPRÁVY
    if (fs.existsSync(MESSAGE_ID_FILE)) {
      const savedId = fs.readFileSync(MESSAGE_ID_FILE, "utf8");

      try {
        message = await channel.messages.fetch(savedId);

        await message.edit({
          embeds: [embed],
        });

        console.log("✅ Embed upraven");
      } catch (err) {
        console.log("⚠️ Stará zpráva neexistuje");

        message = await channel.send({
          embeds: [embed],
        });

        fs.writeFileSync(MESSAGE_ID_FILE, message.id);

        console.log("🆕 Vytvořena nová zpráva");
      }
    } else {
      // PRVNÍ VYTVOŘENÍ
      message = await channel.send({
        embeds: [embed],
      });

      fs.writeFileSync(MESSAGE_ID_FILE, message.id);

      console.log("🆕 První zpráva vytvořena");
    }
  } catch (error) {
    console.error("❌ Chyba:", error.message);
  }
}
