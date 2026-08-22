const { Events } = require('discord.js');
const { ensureLobbyForGuild } = require('../utils/ensureLobby');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild, client) {
    console.log(`➕ Yeni sunucuya eklendi: ${guild.name} (${guild.id}) - otomatik lobi oluşturuluyor...`);
    await guild.channels.fetch().catch(() => {});
    // Biraz bekle, guild tam yüklenene kadar
    setTimeout(async () => {
      await ensureLobbyForGuild(guild, client);
    }, 2000);
  }
};
