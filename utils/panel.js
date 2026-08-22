const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

function buildControlPanel(ownerId) {
  const embed = new EmbedBuilder()
    .setTitle('👑 Ses Odası Kontrol Paneli')
    .setColor(config.embed.color)
    .setDescription(
      `Oda Sahibi: <@${ownerId}>\n` +
      `Aşağıdaki butonları kullanarak ses odanızı yönetebilirsiniz.\n` +
      `(⚠️ *Bu paneli yalnızca oda sahibi kontrol edebilir!*)\n\n` +
      `🔒 **Odayı Kilitle:** Odayı herkese kapatır.\n` +
      `🔓 **Kilit Aç:** Odanın kilidini kaldırır.\n` +
      `👥 **Kişi Limiti:** Odanın kişi sınırını ayarlar.\n` +
      `➕ **Giriş İzni:** Seçtiğiniz bir üyeye giriş izni verir.\n` +
      `🚫 **Odadan At:** İstenmeyen üyeleri odadan atar.`
    )
    .setFooter({ text: `${config.embed.footer} • bugün` })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('lobi_lock')
      .setLabel('Kilitle')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('lobi_unlock')
      .setLabel('Kilit Aç')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('lobi_limit')
      .setLabel('Kişi Limiti')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('lobi_allow')
      .setLabel('Giriş İzni Ver')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('lobi_kick')
      .setLabel('Odadan At')
      .setEmoji('🚫')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { buildControlPanel };
