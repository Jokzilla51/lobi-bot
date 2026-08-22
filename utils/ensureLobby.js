const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

/**
 * Sunucuda lobi kanalının var olduğundan emin ol, yoksa oluştur
 * @returns {Promise<import('discord.js').VoiceChannel|null>}
 */
async function ensureLobbyForGuild(guild, client) {
  // 1) Store'da kayıtlı lobi hala var mı?
  for (const lobbyId of [...client.lobbyChannels]) {
    const ch = guild.channels.cache.get(lobbyId) || await guild.channels.fetch(lobbyId).catch(() => null);
    if (ch && ch.guildId === guild.id && ch.type === ChannelType.GuildVoice) {
      // İsim değişmişse düzelt (isteğe bağlı)
      // if (ch.name !== config.lobbyChannelName) await ch.setName(config.lobbyChannelName).catch(()=>{});
      return ch;
    }
  }

  // 2) İsme göre ara (bot restart sonrası store bozulduysa)
  const existingByName = guild.channels.cache.find(c => c.type === ChannelType.GuildVoice && c.name === config.lobbyChannelName);
  if (existingByName) {
    client.lobbyChannels.add(existingByName.id);
    client.persistStore();
    console.log(`🔍 Lobi bulundu (isme göre): ${guild.name} -> #${existingByName.name} (${existingByName.id})`);
    return existingByName;
  }

  // 3) Hiç yoksa oluştur
  // Yetki kontrolü
  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    console.warn(`⚠️ ${guild.name} - Kanalları Yönet yetkisi yok, lobi oluşturulamadı`);
    return null;
  }

  try {
    const lobby = await guild.channels.create({
      name: config.lobbyChannelName,
      type: ChannelType.GuildVoice,
      // En üste oluştur - parent yok
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD]
        }
      ],
      reason: 'Otomatik lobi oluşturuldu - kullanıcı girince özel oda açılacak'
    });

    client.lobbyChannels.add(lobby.id);
    client.persistStore();
    console.log(`✅ Otomatik lobi oluşturuldu: ${guild.name} -> #${lobby.name} (${lobby.id})`);
    return lobby;
  } catch (e) {
    console.error(`❌ Lobi oluşturulamadı (${guild.name}):`, e.message);
    return null;
  }
}

module.exports = { ensureLobbyForGuild };
