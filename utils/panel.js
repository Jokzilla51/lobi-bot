const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

function buildControlPanel(ownerId, guild) {
  const guildIcon = guild?.iconURL({ dynamic: true, size: 256 }) || undefined;

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setAuthor({ name: 'VYRON VOICE • ÖZEL ODA', iconURL: guildIcon })
    .setTitle('🔊 Oda Kontrol Merkezi')
    .setDescription(
      'Hoş geldin <@' + ownerId + '>. Bu panel ile özel ses odanı hızlıca yönetebilirsin.\n' +
      'Yalnızca oda sahibi ve sunucu yöneticileri işlem yapabilir.'
    )
    .addFields(
      { name: '⚙️ Oda Düzeni', value: 'Kanal adını değiştir, kişi sınırını belirle ve odanı kendi düzenine göre hazırla.', inline: false },
      { name: '🔐 Erişim Kontrolü', value: 'Odayı kilitle, kilidi aç veya seçtiğin kişilere odaya giriş hakkı ver.', inline: false },
      { name: '🛡️ Üye ve Sahiplik', value: 'İstenmeyen kişileri odadan çıkarabilir veya oda sahipliğini güvenle devredebilirsin.', inline: false }
    )
    .setFooter({ text: (config.embed.footer || 'Vyron') + ' • Oda boş kaldığında otomatik silinir' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lobi_lock').setLabel('Odayı Kilitle').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('lobi_unlock').setLabel('Kilidi Aç').setEmoji('🔓').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('lobi_limit').setLabel('Kişi Sınırı').setEmoji('👥').setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lobi_rename').setLabel('Oda Adı').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('lobi_allow').setLabel('Giriş İzni').setEmoji('➕').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('lobi_kick').setLabel('Üyeyi Çıkar').setEmoji('🚫').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('lobi_transfer').setLabel('Sahipliği Devret').setEmoji('👑').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { buildControlPanel };
