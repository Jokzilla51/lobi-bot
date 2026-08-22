const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Artık slash komut yok - sadece buton / modal / select

    // === Buton etkileşimleri ===
    if (interaction.isButton()) {
      const channelId = interaction.channelId; // panelin olduğu ses kanalı
      const guild = interaction.guild;
      if (!guild) return;

      // Sadece temp kanallarda çalışsın
      if (!client.tempChannels.has(channelId)) {
        return interaction.reply({ content: '❌ Bu kanal bir özel ses odası değil!', ephemeral: true });
      }

      const ownerId = client.tempChannels.get(channelId);
      const isOwner = interaction.user.id === ownerId;

      // Oda sahibi kontrolü - fotoğraftaki uyarı: (⚠️ Bu paneli yalnızca oda sahibi kontrol edebilir!)
      if (!isOwner) {
        return interaction.reply({ content: '⚠️ Bu paneli yalnızca **oda sahibi** kontrol edebilir!', ephemeral: true });
      }

      const voiceChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
      if (!voiceChannel) {
        return interaction.reply({ content: '❌ Ses kanalı bulunamadı, silinmiş olabilir.', ephemeral: true });
      }

      const customId = interaction.customId;

      // --- KİLİTLE ---
      if (customId === 'lobi_lock') {
        try {
          await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
          await voiceChannel.permissionOverwrites.edit(ownerId, { Connect: true, ViewChannel: true, Speak: true }).catch(() => {});
          return interaction.reply({ content: '🔒 **Oda kilitlendi!** Artık kimse katılamaz (izin verilenler hariç).', ephemeral: true });
        } catch (e) {
          console.error(e);
          return interaction.reply({ content: '❌ Oda kilitlenemedi. Botun yetkilerini kontrol et.', ephemeral: true });
        }
      }

      // --- KİLİT AÇ ---
      if (customId === 'lobi_unlock') {
        try {
          await voiceChannel.permissionOverwrites.edit(guild.roles.everyone, { Connect: true, ViewChannel: true });
          return interaction.reply({ content: '🔓 **Kilit açıldı!** Herkes odaya katılabilir.', ephemeral: true });
        } catch (e) {
          console.error(e);
          return interaction.reply({ content: '❌ Kilit açılamadı.', ephemeral: true });
        }
      }

      // --- KİŞİ LİMİTİ (Modal) ---
      if (customId === 'lobi_limit') {
        const modal = new ModalBuilder()
          .setCustomId(`lobi_limit_modal:${channelId}`)
          .setTitle('Kişi Limiti Ayarla');

        const input = new TextInputBuilder()
          .setCustomId('limit_value')
          .setLabel('Kişi limiti (0 = sınırsız, 1-99)')
          .setPlaceholder('Örn: 5')
          .setValue(String(voiceChannel.userLimit || 0))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(2);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);
        return interaction.showModal(modal);
      }

      // --- GİRİŞ İZNİ VER (User Select) ---
      if (customId === 'lobi_allow') {
        const row = new ActionRowBuilder().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId(`lobi_allow_select:${channelId}`)
            .setPlaceholder('İzin vermek istediğin üyeyi seç')
            .setMinValues(1)
            .setMaxValues(5)
        );
        return interaction.reply({
          content: '➕ **Giriş İzni Ver:** Aşağıdan izin vermek istediğin üyeleri seç.\n*Seçilen üye oda kilitli olsa bile katılabilecek.*',
          components: [row],
          ephemeral: true
        });
      }

      // --- ODADAN AT (StringSelect - odadaki üyeler) ---
      if (customId === 'lobi_kick') {
        const membersInChannel = [...voiceChannel.members.values()].filter(m => m.id !== ownerId);
        if (membersInChannel.length === 0) {
          return interaction.reply({ content: '❌ Odada atılacak kimse yok! (Sadece sen varsın)', ephemeral: true });
        }
        const options = membersInChannel.slice(0, 25).map(m => ({
          label: m.displayName.slice(0, 100),
          description: `@${m.user.username} - odadan at`,
          value: m.id
        }));

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`lobi_kick_select:${channelId}`)
            .setPlaceholder('Odadan atılacak üyeyi seç')
            .addOptions(options)
            .setMinValues(1)
            .setMaxValues(1)
        );
        return interaction.reply({
          content: '🚫 **Odadan At:** Aşağıdan atmak istediğin üyeyi seç.',
          components: [row],
          ephemeral: true
        });
      }
    }

    // === Modal Submit ===
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('lobi_limit_modal:')) {
        const channelId = interaction.customId.split(':')[1];
        const guild = interaction.guild;
        const ownerId = client.tempChannels.get(channelId);
        if (interaction.user.id !== ownerId) {
          return interaction.reply({ content: '⚠️ Sadece oda sahibi limit ayarlayabilir!', ephemeral: true });
        }
        const voiceChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
        if (!voiceChannel) return interaction.reply({ content: '❌ Kanal bulunamadı.', ephemeral: true });

        const raw = interaction.fields.getTextInputValue('limit_value').trim();
        const num = parseInt(raw, 10);
        if (isNaN(num) || num < 0 || num > 99) {
          return interaction.reply({ content: '❌ Geçersiz değer! 0 ile 99 arasında bir sayı gir (0 = sınırsız).', ephemeral: true });
        }
        try {
          await voiceChannel.setUserLimit(num, `Limit ayarlandı: ${interaction.user.tag}`);
          return interaction.reply({ content: num === 0 ? '✅ **Kişi limiti kaldırıldı!** (Sınırsız)' : `✅ **Kişi limiti ${num} olarak ayarlandı!**`, ephemeral: true });
        } catch (e) {
          console.error(e);
          return interaction.reply({ content: '❌ Limit ayarlanamadı.', ephemeral: true });
        }
      }
    }

    // === Select Menu Submit ===
    if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith('lobi_allow_select:')) {
        const channelId = interaction.customId.split(':')[1];
        const ownerId = client.tempChannels.get(channelId);
        if (interaction.user.id !== ownerId) {
          return interaction.reply({ content: '⚠️ Sadece oda sahibi izin verebilir!', ephemeral: true });
        }
        const guild = interaction.guild;
        const voiceChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
        if (!voiceChannel) return interaction.reply({ content: '❌ Kanal bulunamadı.', ephemeral: true });

        const selectedIds = interaction.values;
        try {
          for (const uid of selectedIds) {
            await voiceChannel.permissionOverwrites.edit(uid, {
              ViewChannel: true,
              Connect: true,
              Speak: true
            });
          }
          const mentions = selectedIds.map(id => `<@${id}>`).join(', ');
          return interaction.reply({ content: `✅ ${mentions} için **giriş izni verildi!**`, ephemeral: true });
        } catch (e) {
          console.error(e);
          return interaction.reply({ content: '❌ İzin verilemedi.', ephemeral: true });
        }
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('lobi_kick_select:')) {
        const channelId = interaction.customId.split(':')[1];
        const ownerId = client.tempChannels.get(channelId);
        if (interaction.user.id !== ownerId) {
          return interaction.reply({ content: '⚠️ Sadece oda sahibi atabilir!', ephemeral: true });
        }
        const guild = interaction.guild;
        const voiceChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
        if (!voiceChannel) return interaction.reply({ content: '❌ Kanal bulunamadı.', ephemeral: true });

        const targetId = interaction.values[0];
        try {
          const member = await guild.members.fetch(targetId).catch(() => null);
          if (!member) return interaction.reply({ content: '❌ Üye bulunamadı.', ephemeral: true });
          if (member.voice.channelId === channelId) {
            await member.voice.disconnect('Oda sahibi tarafından atıldı').catch(() => {});
          }
          return interaction.reply({ content: `✅ <@${targetId}> **odadan atıldı!**`, ephemeral: true });
        } catch (e) {
          console.error(e);
          return interaction.reply({ content: '❌ Üye atılamadı. Botun `Üyeleri Taşı` yetkisi olduğundan emin ol.', ephemeral: true });
        }
      }
    }
  }
};
