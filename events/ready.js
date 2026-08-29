const { Events, ActivityType } = require('discord.js');
const { ensureLobbyForGuild } = require('../utils/ensureLobby');
const { connectAfkVoice } = require('../utils/afkVoice');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Bot giriş yaptı: ${client.user.tag}`);
    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif`);

    client.user.setPresence({
      activities: [{ name: 'Lobi - Katıl ve oluştur 🎧', type: ActivityType.Watching }],
      status: 'online'
    });

    // Her sunucuda lobi kanalını otomatik oluştur / bul
    console.log('🔧 Lobi kanalları kontrol ediliyor (otomatik mod)...');
    for (const [guildId, guild] of client.guilds.cache) {
      // guild.channels.cache hazır olmayabilir, fetch et
      await guild.channels.fetch().catch(() => {});
      await ensureLobbyForGuild(guild, client);
      await connectAfkVoice(guild);
    }
    console.log(`🎧 Lobi sistemi hazır: ${client.lobbyChannels.size} lobi aktif, ${client.tempChannels.size} geçici oda kayıtlı`);

    // Bot yeniden başladığında ölü temp kanalları temizle
    for (const [channelId, ownerId] of [...client.tempChannels.entries()]) {
      try {
        let found = false;
        for (const guild of client.guilds.cache.values()) {
          const ch = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
          if (ch) {
            found = true;
            if (ch.members && ch.members.size === 0) {
              await ch.delete('Boş geçici oda temizliği').catch(() => {});
              client.tempChannels.delete(channelId);
              console.log(`🗑️ Boş oda silindi (restart temizliği): ${ch.name}`);
            }
            break;
          }
        }
        if (!found) {
          client.tempChannels.delete(channelId);
        }
      } catch (e) {}
    }
    client.persistStore();
  }
};
