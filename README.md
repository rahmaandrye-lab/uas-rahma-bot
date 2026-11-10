# Bot Dry Run Indodax: G.Rahma Breakout Hybrid (4 jam)

> **Freeze terlambat:** dilakukan 10 Nov 2026, sesudah batas 4 Nov 2026 12.00 WIB, dengan izin dosen. Forward test tetap berakhir 14 Nov 2026 12.00 WIB, jadi hanya sekitar 3,5 hari.

| | |
|---|---|
| Nama / NIM | Rahma Sarita / 25110200035 |
| Mata kuliah | Algorithmic Trading, tugas individu |
| Vercel | https://uas-rahma-bot.vercel.app |
| Repo | https://github.com/rahmaandrye-lab/uas-rahma-bot |
| Commit freeze | `db1b1fd16714cf457c17c0ef565ed501850bf570` (2026-11-10T16:00:36+07:00), `FREEZE_AT` 2026-11-10T09:00:43Z |

Bot dry run untuk pasar kripto IDR Indodax. Data diambil dari API publik Indodax tanpa API key, dan order hanya disimulasikan di order book. State dan log disimpan di Upstash Redis dengan prefix `rahmabot:`. Satu fungsi `decide()` di [lib/strategy.js](lib/strategy.js) dipakai oleh bot ([api/tick.js](api/tick.js)) dan backtest ([tools/backtest.mjs](tools/backtest.mjs)).

## 1. Strategi
Sumber: dashboard **G.Rahma** (Breakout Hybrid, saham Kompas 100 harian). Keputusan diambil di close candle 4 jam yang sudah tertutup. Panjang indikator ditulis dalam hari × 6 candle.

| Aturan | Isi |
|---|---|
| **Beli (breakout)** | close > high tertinggi 330 candle sebelumnya (55 hari) **dan** close > SMA 600 candle (100 hari) |
| **Beli lagi (re-entry)** | sesudah exit tidak boleh masuk lagi di bulan yang sama. Di candle terakhir bulan, pasangan yang sudah exit boleh masuk lagi bila close > SMA 600 candle |
| **Jual** | close ≤ harga beli × (1 − 8%), diperiksa lebih dulu, **atau** close < low terendah 120 candle sebelumnya (20 hari) |
| Ukuran posisi | 10% ekuitas per posisi, maksimum 10 slot, satu posisi per pasangan |
| Bila kandidat > slot kosong | urut dari yang terkuat (close ÷ high, atau close ÷ SMA untuk re-entry) |
| Daily loss limit | ekuitas ≤ 95% ekuitas awal hari WIB → tidak membuka posisi baru sampai 00.00 WIB berikutnya. Exit tetap berjalan |
| Kill switch | `/api/kill?aktif=1` (flag Redis) atau env `KILL_SWITCH=1`. Tidak membuka posisi baru, exit tetap berjalan |
| Validasi sebelum beli | candle terakhir tidak basi, tidak ada candle hilang, harga dan volume tidak nol, order book tidak kosong, spread bid–ask ≤ 2%. Sinyal yang ditolak tetap dicatat |

## 2. Perubahan dari sumber asli
| Bagian | Sumber (saham Kompas 100, harian) | Bot (kripto Indodax, 4 jam) | Alasan |
|---|---|---|---|
| Universe | 100 saham Kompas 100 | BTC ETH XRP DOGE TRX VELO ADA BNB /IDR | 10 pasangan paling likuid Agustus–Oktober 2023, dikurangi VRA dan LOOM yang sudah delisting |
| Panjang indikator | 55 / 20 / 100 hari | 330 / 120 / 600 candle 4 jam | Rentang waktunya sama dengan aslinya |
| Eksekusi | open hari berikutnya + 1 tick | Order book live sesudah candle tutup; backtest di open candle berikutnya ± spread dan slippage terukur | Sinyal baru diketahui setelah candle tutup |
| Biaya | fee broker saham | Fee taker 0,20555% beli, 0,41555% jual, minimum order Rp25.000 | Halaman biaya resmi Indodax, `data/sumber_biaya/` |
| Lot | 100 lembar | kuantitas pecahan 1e-8 | Aturan Indodax |
| Tambahan UAS | – | daily loss limit, kill switch, validasi data, idempotency per candle | Wajib UAS |

Tidak ada filter pasar (IHSG/BTC), sama dengan engine G.Rahma.

## 3. Hasil backtest
Modal Rp100 juta, long only, keputusan di close dan eksekusi di open candle berikutnya.

| Mulai | CAGR | MDD | PF | Trade | Win rate | Porsi biaya | Beli & tahan BTC/IDR |
|---|---|---|---|---|---|---|---|
| 2023-11-01 | 25,42% | −23,46% | 2,35 | 88 | 32,95% | 10,58% | +146,01% (MDD −49,43%) |
| 2022-11-01 | 18,79% | −23,46% | 2,16 | 117 | 31,62% | 12,18% | +322,23% (MDD −49,43%) |

Per tahun sejak Nov 2023: 2023 +14,21%, 2024 +73,06%, 2025 +1,29%, 2026 −0,89%. Rata-rata untung +43,34%, rata-rata rugi −7,12%. Rincian per pasangan di `data/backtest_2023-11.txt` dan `data/backtest_2022-11.txt`.

**Keterbatasan:**
- Hasil sangat bergantung pada 2024; 2025 dan 2026 hampir datar.
- DOGE merugi (PF 0,48), tetapi tetap di universe.
- Median spread dan slippage memakai 11 snapshot order book dari bot lain sampai 2026-11-04 02:40 UTC (`data/snapshots/`), jadi bisa lebih optimistis dari fill nyata.
- Rata-rata hanya sekitar 1 trade tiap 12 hari. Forward test yang pendek bisa tanpa trade sama sekali.
- VELO hampir selalu ditolak karena spread > 2%.

## 4. Menjalankan
```
node tools/fetch_history.mjs 240 2022-02-01
node tools/spread_stats.mjs 15000000 2026-11-04T02:40
node tools/backtest.mjs 2023-11-01 --trades data/bt_trades.csv --sinyal data/bt_sinyal.csv --ekuitas data/bt_ekuitas.csv --ringkasan public/backtest_ringkasan.json
node tools/tes_lokal.mjs
```
Deploy: buat proyek Vercel, pasang Upstash Redis dan QStash, isi variabel dari `.env.example`, lalu panggil `POST /api/jadwal` dengan `CRON_SECRET` untuk membuat jadwal QStash (menit ke-13 tiap jam). Vercel Cron harian 00.17 UTC menjadi cadangan.

Pengaman: kunci Redis menolak panggilan paralel, dan `state.lastCandle` memastikan tiap candle hanya diproses sekali. Tiap request dicoba maksimal 3 kali, dan error tercatat di log `errors`. Log mentah: `calls`, `signals`, `orders`, `equity`, `errors`, `snapshots`, `kill`, `notes`.

Akhir forward test (sesudah candle terakhir tutup, 14 Nov setelah 15.00 WIB):
```
node tools/ekspor_log.mjs
node tools/fetch_history.mjs 240 2022-02-01
node tools/hitung_ulang.mjs
```
Variabel rahasia hanya di `.env` dan Vercel. Jangan di-commit.
