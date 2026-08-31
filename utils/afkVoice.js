const { ChannelType } = require('discord.js');
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection
} = require('@discordjs/voice');

const TARGET_VOICE_NAME = 'discord.gg/vyronmc';
const reconnectTimers = new Map();

function findTargetVoiceChannel(guild) {
  return guild.channels.cache.find(channel =>
    (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) &&
    channel.name.toLowerCase().trim() === TARGET_VOICE_NAME
  ) || null;
}

async function connectAfkVoice(guild) {
  if (process.env.VOICE_ENABLED !== 'true') return null;
  try {
    await guild.channels.fetch().catch(() => {});
    const targetChannel = findTargetVoiceChannel(guild);

    if (!targetChannel) {
      console.log(`ℹ️ ${guild.name}: "${TARGET_VOICE_NAME}" adlı ses kanalı bulunamadı.`);
      return null;
    }

    const existing = getVoiceConnection(guild.id);
    if (existing) {
      try {
        const currentChannelId = existing.joinConfig?.channelId;
        if (currentChannelId === targetChannel.id) return existing;
        existing.destroy();
      } catch {}
    }

    const connection = joinVoiceChannel({
      channelId: targetChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: true
    });

    connection.on('error', (error) => {
    console.error('❌ ' + guild.name + ' ses bağlantısı kapandı:', error.message);
    try { connection.destroy(); } catch {}
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
      } catch {
        try { connection.destroy(); } catch {}
        if (reconnectTimers.has(guild.id)) clearTimeout(reconnectTimers.get(guild.id));
        reconnectTimers.set(guild.id, setTimeout(() => {
          reconnectTimers.delete(guild.id);
          connectAfkVoice(guild).catch(() => {});
        }, 5_000));
      }
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 15_000).catch(() => {});
    console.log(`🔊 ${guild.name}: Lobi botu "${targetChannel.name}" kanalında AFK (mute + deafen).`);
    return connection;
  } catch (error) {
    console.error(`❌ ${guild.name} AFK ses bağlantısı hatası:`, error.message);
    return null;
  }
}

module.exports = {
  connectAfkVoice,
  TARGET_VOICE_NAME
};
