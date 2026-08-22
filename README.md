# Discord Lobi Botu - Otomatik (Komutsuz)

Fotoğraflardaki gibi, **hiç komut yazmadan** çalışan özel ses odası botu.

### Nasıl çalışır?
1. Botu sunucuya davet et → otomatik olarak `• Lobi - Katıl ve oluştur` ses kanalını oluşturur
2. Biri o kanala girince → otomatik `[ 🎧 ] kullanıcıAdı` odasını oluşturur ve kişiyi oraya taşır
3. Odanın **sesiçi sohbetine** `Ses Odası Kontrol Paneli` embed + 5 buton gönderir
4. Oda boş kalınca otomatik silinir, lobi silinirse otomatik yeniden oluşturulur
5. **Hiçbir slash komut yok** - her şey otomatik

### Kontrol Paneli (foto 3 ile birebir)
- 🔒 Kilitle: Odayı herkese kapatır
- 🔓 Kilit Aç: Herkese açar
- 👥 Kişi Limiti: 0-99 limit (modal ile)
- ➕ Giriş İzni Ver: UserSelect ile kilitli odaya izin ver
- 🚫 Odadan At: Odadaki üyeyi sesten at

Sadece **oda sahibi** butonları kullanabilir.

## Kurulum (2 dakika)

### 1) Bot oluştur
https://discord.com/developers/applications → New Application → Bot → Add Bot → Token'ı kopyala
- Bot → Privileged Intents: gerek yok (kapalı kalabilir)

### 2) Botu davet et
OAuth2 → URL Generator → Scopes: `bot` → Permissions:
- `Manage Channels` (Kanalları Yönet)
- `Move Members` (Üyeleri Taşı)
- `Manage Roles` (Rolleri Yönet)
- `View Channel`, `Connect`, `Speak`, `Send Messages`, `Embed Links`

Oluşan URL ile botu sunucuna ekle. **Bot rolünü en üste al.**

### 3) .env ayarla
```env
TOKEN=bot_tokenin_buraya
```
Sadece TOKEN yeterli!

### 4) Çalıştır
```bash
npm install
npm start
```
Konsolda `✅ Otomatik lobi oluşturuldu: SunucuAdı -> #• Lobi - Katıl ve oluştur` görürsen tamam!

### 5) Test et
Discord'da `• Lobi - Katıl ve oluştur` kanalına gir → kendi odan açılacak ve odanın sohbetinde panel gelecek.

## Özelleştirme
`config.js`:
```js
lobbyChannelName: "• Lobi - Katıl ve oluştur" // lobi ismi
tempChannelName: "[ 🎧 ] {username}"         // özel oda ismi, {username} yerine ad gelir
```

## Dosya Yapısı
```
index.js
config.js
utils/ensureLobby.js  -> otomatik lobi oluşturma mantığı
utils/panel.js        -> kontrol paneli embed
utils/store.js        -> data.json persist
events/ready.js       -> açılışta her sunucuya lobi kur
events/guildCreate.js -> yeni sunucuya eklenince lobi kur
events/channelDelete.js -> lobi silinirse yeniden oluştur
events/voiceStateUpdate.js -> oda oluştur/sil
events/interactionCreate.js -> butonlar
```

## Sorun Giderme
- **Lobi oluşmuyor?** Botun `Kanalları Yönet` yetkisi var mı? Konsolda hata yazıyor mu?
- **Oda oluşmuyor?** Botun `Üyeleri Taşı` yetkisi şart
- **Panel gelmiyor?** Botun ses kanalında `Mesaj Gönder` yetkisi var mı? (Ses kanalları text destekliyor)

İyi eğlenceler!
