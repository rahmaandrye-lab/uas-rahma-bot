// TAMPILAN DASHBOARD — satu kode untuk halaman Vercel (public/index.html) dan HTML offline (tools/hitung_ulang.mjs menyematkan file ini).
// Input: { bt: ringkasan backtest (public/backtest_ringkasan.json), fw: forwardFromLogs(...), gap: hasil pencocokan (opsional, dari hitung_ulang), sumber }
export function renderDashboard(el, { bt, fw, gap = null, sumber = '', status = null, latihan = null }) {
  const pct = (x, d = 2) => x == null || !isFinite(x) ? '–' : (x * 100).toFixed(d).replace('.', ',') + '%', num = (x, d = 2) => x == null ? '–' : x === Infinity ? '∞' : x.toFixed(d).replace('.', ','), rp = x => x == null ? '–' : 'Rp' + Math.round(x).toLocaleString('id-ID');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tbl = (head, rows) => '<div class="w"><table><thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' + (rows.length ? rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${head.length}" class="m">belum ada</td></tr>`) + '</tbody></table></div>';
  const T = fw.trade, B = bt.trade, op = fw.operasional;
  let h = `<p class="m">Sumber data: ${esc(sumber)} · jendela forward ${esc(fw.jendela.mulai)} → ${esc(fw.jendela.akhir)} UTC · semua angka dihitung dari log mentah (public/metrics.js), sama dengan skrip hitung_ulang.</p>`;
  if (status) { const wib = t => t ? new Date(Date.parse(t.length === 16 ? t + ':00Z' : t) + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') + ' WIB' : '–', L = status.terakhir;
    const fase = { sebelum_freeze: `Persiapan: forward test mulai ${wib(status.freeze)}. Trade sebelum itu hanya latihan dan direset saat freeze.`, forward: `Forward test berjalan sampai ${wib(status.akhir)}.`, selesai: 'Forward test selesai.' }[status.fase];
    h += '<h2>Status bot</h2><p class="m">' + esc(fase) + '</p>' + tbl(['Panggilan terakhir', 'Pemanggil', 'Hasil', 'Candle terakhir diproses (waktu buka)', 'Total panggilan sejak deploy', 'Panggilan error', 'Ekuitas', 'Posisi terbuka'],
      [[wib(L?.t), esc(L?.sumber), esc(L?.hasil) + (L?.error ? ` (${L.error} error)` : ''), wib(status.candle_terakhir_diproses), status.panggilan_total, status.panggilan_error, rp(status.ekuitas), esc(status.posisi.join(', ') || '–')]]); }
  if (latihan && status?.fase === 'sebelum_freeze') { const o = latihan.operasional;
    h += '<h2>Uji coba sebelum freeze</h2><p class="m">Jendela ' + esc(latihan.jendela.mulai.slice(0, 16)) + ' UTC (panggilan terjadwal pertama) → sekarang. Rumus sama dengan forward test; angka ini TIDAK masuk hasil UAS.</p>'
      + tbl(['Candle terjadwal', 'Terproses tepat waktu', 'Uptime', 'Panggilan', 'Panggilan error', 'Error API', 'Kill switch', 'Trade latihan', 'Return latihan'],
        [[o.candle_terjadwal, o.candle_tepat_waktu, pct(o.uptime, 1), o.panggilan, o.panggilan_error, o.error_api, o.kill_switch, latihan.trade.jumlah, pct(latihan.ekuitas.return_total)]]);
    if (o.candle_terlewat.length) h += `<p class="m">Candle terlewat: ${o.candle_terlewat.map(esc).join(', ')}</p>`;
    h += latihan.error_terakhir.length ? tbl(['Waktu', 'Tahap / URL', 'Error'], latihan.error_terakhir.map(e => [esc(e.t), esc(e.tahap || e.url || e.pair || ''), esc(String(e.error).slice(0, 160))])) : '<p class="m">Belum ada error yang tercatat.</p>'; }
  h += '<h2>Ringkasan</h2>'   + tbl(['Metrik', `Backtest ${esc(bt.mulai.slice(0, 10))} → ${esc(bt.akhir.slice(0, 10))}`, 'Forward test (sampai 14 Nov)'], [
    ['Return total', pct(bt.ekuitas.return_total), pct(fw.ekuitas.return_total)], ['CAGR', pct(bt.ekuitas.cagr), '— (tidak bermakna untuk jendela pendek)'], ['Maximum drawdown', '−' + pct(bt.ekuitas.mdd), fw.ekuitas.mdd == null ? '–' : '−' + pct(fw.ekuitas.mdd)],
    ['Jumlah trade', B.jumlah, T.jumlah], ['Win rate', pct(B.win_rate, 1), pct(T.win_rate, 1)], ['Profit factor', num(B.profit_factor), num(T.profit_factor)],
    ['Rata-rata untung / rugi per trade', pct(B.rata_untung, 1) + ' / ' + pct(B.rata_rugi, 1), pct(T.rata_untung, 1) + ' / ' + pct(T.rata_rugi, 1)],
    ['Porsi biaya (fee + spread + slippage) ÷ laba kotor', pct(B.porsi_biaya, 1), pct(T.porsi_biaya, 1)], ['Beli & tahan BTC/IDR (periode sama)', pct(bt.beli_tahan_btc.return_total), pct(fw.beli_tahan_btc)]]);
  h += '<h2>Operasional</h2>' + tbl(['Candle terjadwal', 'Terproses tepat waktu', 'Uptime', 'Panggilan', 'Panggilan error', 'Error API (setelah retry dicatat)', 'Pemakaian kill switch'],
    [[op.candle_terjadwal, op.candle_tepat_waktu, pct(op.uptime, 1), op.panggilan, op.panggilan_error, op.error_api, op.kill_switch]]);
  if (op.candle_terlewat?.length) h += `<p class="m">Candle tidak terproses tepat waktu: ${op.candle_terlewat.map(esc).join(', ')}</p>`;
  if (gap) { h += '<h2>Gap backtest vs forward (jendela forward yang sama)</h2>' + tbl(['Sinyal bot', 'Sinyal backtest', 'Identik', 'Kecocokan', 'Return backtest jendela', 'Return forward', 'Selisih'],
      [[gap.sinyal.bot, gap.sinyal.backtest, gap.sinyal.identik, pct(gap.sinyal.kecocokan, 1), pct(gap.bt_jendela.return_total), pct(fw.ekuitas.return_total), pct(fw.ekuitas.return_total - gap.bt_jendela.return_total)]]);
    if (gap.sinyal.hanya_bot.length || gap.sinyal.hanya_backtest.length) h += `<p class="m">Hanya di bot: ${gap.sinyal.hanya_bot.map(esc).join('; ') || '–'} · hanya di backtest: ${gap.sinyal.hanya_backtest.map(esc).join('; ') || '–'}</p>`;
    h += tbl(['Candle', 'Pasangan', 'Sisi', 'Harga fill bot', 'Harga fill backtest', 'Selisih', 'Terlambat dari tutup candle'], gap.fill.map(f => [esc(f.candle), esc(f.pair), esc(f.sisi), num(f.bot, 4), num(f.backtest, 4), pct(f.selisih, 3), f.telat_menit + ' menit'])); }
  h += '<h2>Trade forward</h2>' + tbl(['Pasangan', 'Masuk', 'Keluar', 'Hasil', 'Return', 'Biaya', 'Alasan'], fw.trades.map(t => [esc(t.pair), esc(t.masuk), esc(t.keluar), rp(t.pnl), pct(t.ret), rp(t.biaya), esc(t.alasan)]));
  h += '<h2>Sinyal forward (log bot)</h2>' + tbl(['Candle', 'Pasangan', 'Sisi', 'Alasan', 'Harga sinyal', 'Data valid'], fw.sinyal.map(s => [esc(s.candle), esc(s.pair), esc(s.sisi), esc(s.alasan), num(s.harga_sinyal, 4), s.valid === false ? 'tidak: ' + esc((s.alasan_tidak_valid || []).join(', ')) : 'ya']));
  const cls = x => x == null ? '' : x >= 0 ? 'up' : 'down', kpi = (emo, lbl, val, sub, c = '') => `<div class="kpi"><div class="emo">${emo}</div><div class="lbl">${lbl}</div><div class="val ${c}">${val}</div><div class="sub">${sub}</div></div>`;
  const kpis = '<div class="kpis">' + kpi('💖', 'Return forward', pct(fw.ekuitas.return_total), 'jendela forward sampai 14 Nov', cls(fw.ekuitas.return_total)) + kpi('🌸', 'Drawdown forward', fw.ekuitas.mdd == null ? '–' : '−' + pct(fw.ekuitas.mdd), `trade forward: ${T.jumlah}`, fw.ekuitas.mdd ? 'down' : '')
    + kpi('🍯', 'Uptime', pct(op.uptime, 1), `${op.candle_tepat_waktu} dari ${op.candle_terjadwal} candle tepat waktu`) + kpi('🧸', 'CAGR backtest', pct(bt.ekuitas.cagr), `MDD −${pct(bt.ekuitas.mdd)} · PF ${num(B.profit_factor)}`, cls(bt.ekuitas.cagr)) + kpi('🎀', 'Beli & tahan BTC/IDR', pct(fw.beli_tahan_btc), 'jendela forward yang sama', cls(fw.beli_tahan_btc)) + '</div>';
  const [intro, ...parts] = h.split('<h2>');
  el.innerHTML = intro + kpis + parts.map(x => '<div class="card"><h2>' + x + '</div>').join('');
}
export const CSS = `:root{--bg:#eef1f6;--bg2:#e3e8f0;--card:#fbfcfe;--bd:#d6dce7;--ink:#17233b;--mut:#69768f;--navy:#1f3a6e;--navy2:#2f56a0;--up:#1b9e6b;--down:#d9485f;--th:#e8edf5;--hov:#f2f5fa;--hd:#1f3a6e;--hdt:#ffffff;--hds:#c9d4ea}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0f1522;--bg2:#141c2c;--card:#172033;--bd:#2a3550;--ink:#e6ebf5;--mut:#9aa6bf;--navy:#8fb0ec;--navy2:#a9c2f2;--up:#37c48d;--down:#f0718a;--th:#1d2840;--hov:#1b2539;--hd:#141c2c;--hdt:#e6ebf5;--hds:#9aa6bf}}
:root[data-theme=dark]{--bg:#0f1522;--bg2:#141c2c;--card:#172033;--bd:#2a3550;--ink:#e6ebf5;--mut:#9aa6bf;--navy:#8fb0ec;--navy2:#a9c2f2;--up:#37c48d;--down:#f0718a;--th:#1d2840;--hov:#1b2539;--hd:#141c2c;--hdt:#e6ebf5;--hds:#9aa6bf}
*{box-sizing:border-box}html,body{margin:0;overflow-x:hidden;color:var(--ink);font:14px/1.55 Inter,system-ui,sans-serif}body{background:var(--bg)}
header{background:var(--hd);color:var(--hdt);padding:18px 16px;border-bottom:1px solid var(--bd)}
.hwrap{max-width:1280px;margin:0 auto}.brand{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.logo{width:40px;height:40px;border-radius:10px;background:var(--navy2);color:#fff;display:grid;place-items:center;font:700 15px Inter,sans-serif}
.brand h1{font:700 22px/1.2 Inter,sans-serif;margin:0;letter-spacing:-.2px}.brand h1 span{color:var(--hds);font-weight:500}.brand small{display:block;color:var(--hds);font-size:12.5px;font-weight:500;margin-top:2px}
main{max-width:1280px;margin:0 auto;padding:20px 16px 48px}.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:16px;margin-top:14px}
h2{font:700 16px Inter,sans-serif;margin:0 0 10px;color:var(--ink)}
.kpis{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-top:14px}.kpi{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px 16px}
.kpi .emo{display:none}.kpi .lbl{font:600 12px Inter,sans-serif;color:var(--mut);text-transform:uppercase;letter-spacing:.4px}.kpi .val{font:700 26px/1.2 Inter,sans-serif;margin-top:6px;font-variant-numeric:tabular-nums}.kpi .sub{font-size:12px;color:var(--mut);margin-top:4px}
.up{color:var(--up)}.down{color:var(--down)}.m{color:var(--mut);font-size:13px}a{color:var(--navy2)}
.w{overflow:auto;max-height:440px;border:1px solid var(--bd);border-radius:10px;background:var(--card)}table{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums}th{position:sticky;top:0;background:var(--th);color:var(--mut);text-align:left;font:600 12px Inter,sans-serif;padding:9px 10px;white-space:nowrap}td{padding:7px 10px;border-top:1px solid var(--bd);vertical-align:top}tbody tr:hover td{background:var(--hov)}
@media(max-width:600px){.brand h1{font-size:19px}.kpi .val{font-size:22px}}`;
