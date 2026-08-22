const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data.json');

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { lobbies: [], temps: {} };
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return {
      lobbies: Array.isArray(data.lobbies) ? data.lobbies : [],
      temps: data.temps && typeof data.temps === 'object' ? data.temps : {}
    };
  } catch (e) {
    console.error('Store yüklenemedi:', e);
    return { lobbies: [], temps: {} };
  }
}

function saveStore(data) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Store kaydedilemedi:', e);
  }
}

module.exports = { loadStore, saveStore, STORE_PATH };
