require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { loadStore, saveStore } = require('./utils/store');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

// Global storage - komut yok, sadece lobi sistemi
client.tempChannels = new Map(); // voiceChannelId -> ownerId
client.lobbyChannels = new Set(); // lobbyVoiceChannelIds

// Load persistent store
const store = loadStore();
if (store.lobbies) {
  for (const id of store.lobbies) client.lobbyChannels.add(id);
}
if (store.temps) {
  for (const [chId, ownerId] of Object.entries(store.temps)) {
    client.tempChannels.set(chId, ownerId);
  }
}

// Helper to persist
client.persistStore = () => {
  saveStore({
    lobbies: [...client.lobbyChannels],
    temps: Object.fromEntries(client.tempChannels)
  });
};

// Load events (ready, voiceStateUpdate, interactionCreate, guildCreate, channelDelete)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

client.on('error', console.error);
process.on('unhandledRejection', console.error);

if (!process.env.TOKEN) {
  console.error('❌ .env dosyasında TOKEN bulunamadı! .env.example dosyasına bak.');
  process.exit(1);
}

client.login(process.env.TOKEN);
