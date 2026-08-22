const { Events } = require('discord.js');
const { ensureLobbyForGuild } = require('../utils/ensureLobby');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel, client) {
    // Lobi kanalı silindiyse
    if (client.lobbyChannels.has(channel.id)) {
      client.lobbyChannels.delete(channel.id);
      client.persistStore();
      console.log(`⚠️ Lobi kanalı silindi: ${channel.name} (${channel.id}) - yeniden oluşturuluyor...`);
      // 2 saniye sonra otomatik yeniden oluştur
      setTimeout(async () => {
        const guild = channel.guild;
        if (guild) {
          await guild.channels.fetch().catch(() => {});
          await ensureLobbyForGuild(guild, client);
        }
      }, 2000);
    }

    // Geçici oda silindiyse map'ten temizle
    if (client.tempChannels.has(channel.id)) {
      client.tempChannels.delete(channel.id);
      client.persistStore();
    }
  }
};
