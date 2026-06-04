const response = await axios.get(
    "https://api.mozambiquehe.re/maprotation?version=2",
    {
        params: {
            auth: process.env.APEX_API_KEY
        }
    }
);

console.log("API DATA:");
console.log(JSON.stringify(response.data, null, 2));

let ranked = null;

// starý formát
if (response.data.ranked) {
    ranked = response.data.ranked;
}

// nový formát
if (response.data.battle_royale?.ranked) {
    ranked = response.data.battle_royale.ranked;
}

if (!ranked) {
    console.log("❌ Apex API nevrátilo ranked data");
    return;
}
