const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const { buildControlPanel } = require('../utils/panel');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const guild = newState.guild || oldState.guild;
    const member = newState.member || oldState.member;
    if (!guild || !member || member.user.bot) return;

    // === 1) Biri Lobi kanalına katıldıysa → yeni oda oluştur ===
    if (newState.channelId && client.lobbyChannels.has(newState.channelId)) {
      // Kullanıcının zaten bir odası varsa onu kullan? Hayır, yeni oda oluşturma spamini engelle
      // Eğer kullanıcı zaten bir temp odaya sahipse, onu silmeden yeni oluşturma - move et
      const lobbyChannel = guild.channels.cache.get(newState.channelId) || await guild.channels.fetch(newState.channelId).catch(() => null);
      if (!lobbyChannel) return;

      const displayName = member.displayName || member.user.username;
      const channelName = config.tempChannelName.replace('{username}', displayName).replace('{user}', displayName);

      try {
        const parentId = lobbyChannel.parentId || null;

        // Yeni ses kanalı oluştur
        const tempChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: parentId,
          userLimit: 0,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseVAD, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.EmbedLinks],
            },
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.EmbedLinks
              ],
            },
            {
              id: client.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.EmbedLinks
              ],
            }
          ],
          reason: `Lobi sistemi - ${displayName} için oluşturuldu`
        });

        // Kayıt et
        client.tempChannels.set(tempChannel.id, member.id);
        client.persistStore();

        // Kullanıcıyı yeni odaya taşı
        await newState.setChannel(tempChannel).catch(async (err) => {
          console.error('Taşıma hatası:', err);
          // Taşınamazsa kanalı sil
          // await tempChannel.delete().catch(()=>{});
          // client.tempChannels.delete(tempChannel.id);
        });

        // Kontrol panelini yeni odanın sohbetine gönder
        // Ses kanalları artık mesaj gönderebiliyor
        const panel = buildControlPanel(member.id);
        await tempChannel.send(panel).catch(e => console.error('Panel gönderilemedi:', e));

        console.log(`🎧 Yeni oda oluşturuldu: ${channelName} (${tempChannel.id}) sahibi: ${displayName}`);

      } catch (err) {
        console.error('Temp kanal oluşturulamadı:', err);
      }
    }

    // === 2) Bir temp kanaldan ayrılma / boş kalma kontrolü → sil ===
    // oldState.channelId var ve tempChannels içindeyse kontrol et
    if (oldState.channelId && client.tempChannels.has(oldState.channelId)) {
      // Kısa bir gecikme ver, çünkü move durumunda önce leave sonra join tetiklenir
      setTimeout(async () => {
        try {
          const channel = guild.channels.cache.get(oldState.channelId) || await guild.channels.fetch(oldState.channelId).catch(() => null);
          if (!channel) {
            client.tempChannels.delete(oldState.channelId);
            client.persistStore();
            return;
          }
          // Hala members var mı?
          // GuildVoice kanallarda .members var
          if (channel.members.size === 0) {
            await channel.delete('Geçici oda boş kaldı').catch(() => {});
            client.tempChannels.delete(oldState.channelId);
            client.persistStore();
            console.log(`🗑️ Boş oda silindi: ${channel.name} (${channel.id})`);
          }
        } catch (e) {
          console.error('Oda silme hatası:', e);
        }
      }, 1500);
    }

    // === 3) Bot restart sonrası yetim kanalları temizleme için ek kontrol: member bir temp kanala katıldı mı ama map'te yoksa? ===
    // Eğer kanal ismi temp formatındaysa ve boş değilse dokunma - ama owner bilinmiyorsa ilk giren owner olur
    // Bu opsiyonel, şimdilik boş geç
  }
};
