# $BRICK buyback & burn engine

Port dari engine BLAZE (`../token5/bot/pons-burn-bot.ts`) untuk Pons Family v2 di Robinhood Chain (4663).
Siklusnya sama persis dengan token5:

- **Siklus ganjil (BURN)**: fee creator di Pons Fee Escrow ≥ `BURN_THRESHOLD_ETH` (0.01) → `claim()` → beli $BRICK
  (Pons curve, atau Uniswap v4 kalau sudah graduate) → token yang baru dibeli dikirim ke `0x…dEaD`.
- **Siklus genap (KEEP)**: escrow ≥ `KEEP_THRESHOLD_ETH` (0.02) → `claim()` → ETH dikirim ke `TREASURY_ADDRESS`
  (atau disimpan di wallet operator kalau kosong).
- `BURN_ONLY=1`: tidak klaim, tidak beli; hanya membakar $BRICK yang masuk ke wallet operator.

Setiap langkah disimpan di `bot/data/run.json`, jadi kalau bot restart di tengah siklus, dia melanjutkan tanpa klaim/beli dua kali.

Bedanya dari token5: nama, port 5047, konfigurasi hanya lewat `.env` (tidak ada admin API yang bisa mengubah key/CA dari web),
riwayat burn terstruktur (`bot/data/burns.json`) dan statistik on-chain (total supply, saldo dead address) untuk furnace log di website.

## Jalankan

```bash
cp bot/.env.example bot/.env      # isi CREATOR_PRIVATE_KEY, TOKEN_ADDRESS, TREASURY_ADDRESS
npm run bot                       # engine + API read-only di 127.0.0.1:5047
npm run build && npm start        # website; /api/engine/* diteruskan ke engine
```

Di server pakai PM2:

```bash
pm2 start "npm run bot" --name brick-engine
pm2 start "npm start" --name brick-site
```

Website dan engine harus di server yang sama (engine hanya listen di 127.0.0.1). Kalau engine di mesin lain,
set `BOT_URL` saat build/start website.

## API (read-only)

- `GET /api/status`: mode, CA, saldo escrow, jenis siklus berikutnya, total supply, saldo dead address, 20 burn terakhir.
- `GET /api/logs`: 40 log terakhir.

Website otomatis pindah dari data demo (berlabel) ke data live begitu engine menjawab dengan token yang terkonfigurasi.

## Checklist launch

1. Launch $BRICK di Pons **dari wallet yang key-nya dipakai engine** (fee creator masuk ke escrow atas nama wallet itu).
2. Isi sedikit ETH di wallet itu untuk gas.
3. Isi `bot/.env`, jalankan `npm run bot`, cek `/api/status`: `live: true` dan `chain.totalSupply` terisi.
4. Siklus pertama jalan begitu escrow mencapai 0.01 ETH.

## Status tes mainnet (17 Okt 2026)

Read-only ke mainnet sudah lulus, memakai token Pons v2 yang sudah live (`0xc554…1bf4`) dan wallet acak bersaldo nol:
semua kontrak (token, curve, Pons fee escrow, Uniswap v4 router/pool manager) ada dan pemanggilan engine berhasil;
engine membaca supply + dead balance, mendeteksi curve sendiri, dan tidak menjalankan siklus karena escrow 0.

Belum dites: transaksi asli (claim, buy, burn, kirim treasury) dan pencarian pool Uniswap v4 setelah graduate
(`eth_getLogs`). Itu baru bisa dicek setelah $BRICK launch, dengan siklus pertama di threshold kecil.

Catatan RPC: `rpc.mainnet.chain.robinhood.com` timeout dari jaringan development (bukan masalah kode). Di VPS biasanya normal.
Endpoint publik NodeFlare (`rpc.nodeflare.app/robinhood/public`) menolak request dari Node.js (Cloudflare) dan dibatasi
1 request/10 detik, jadi tidak cocok untuk engine. Untuk produksi pakai RPC resmi atau provider berbayar (QuickNode, Alchemy).
