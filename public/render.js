// TAMPILAN DASHBOARD — satu kode untuk halaman Vercel (public/index.html) dan HTML offline (tools/hitung_ulang.mjs menyematkan file ini).
// Input: { bt: ringkasan backtest (public/backtest_ringkasan.json), fw: forwardFromLogs(...), gap: hasil pencocokan (opsional, dari hitung_ulang), sumber }
export function renderDashboard(el, { bt, fw, gap = null, sumber = '', status = null, latihan = null }) {
  const pct = (x, d = 2) => x == null || !isFinite(x) ? '–' : (x * 100).toFixed(d).replace('.', ',') + '%', num = (x, d = 2) => x == null ? '–' : x === Infinity ? '∞' : x.toFixed(d).replace('.', ','), rp = x => x == null ? '–' : 'Rp' + Math.round(x).toLocaleString('id-ID');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tbl = (head, rows) => '<div class="sc"><table><thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' + (rows.length ? rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${head.length}" class="m">belum ada</td></tr>`) + '</tbody></table></div>';
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
export const CSS = `:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);
--bg:#eef1f6;--bg2:#e3e8f0;--card:#fbfcfe;--tx:#1b2a4a;--mut:#69768f;--bd:#d6dce7;--navy:#1f3a6e;--navy2:#2f56a0;--sky:#dbe6f7;
--grn:#1b9e6b;--red:#d9485f;--amb:#c98612;--pink:#f3b8c8;--shadow:0 1px 2px rgba(31,58,110,.06);color-scheme:light}
html{scroll-padding-top:env(safe-area-inset-top,0px);scroll-behavior:smooth}
*{box-sizing:border-box}[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--tx);font:400 14px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;overflow-x:hidden}
h1,h2,h3,.k .v,.big,.fred{font-family:Inter,system-ui,sans-serif;font-weight:700}
.w{max-width:1160px;margin:0 auto;padding:18px 16px 50px;position:relative}
.num,td,.k .v{font-variant-numeric:tabular-nums}
.p{color:var(--grn)}.n{color:var(--red)}.mut{color:var(--mut)}

/* header lucu */
.hd{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:14px 18px;box-shadow:var(--shadow);position:relative;overflow:hidden}
.logo{width:44px;height:44px;border-radius:10px;background:var(--navy);color:#fff;display:grid;place-items:center;font-weight:700;font-size:20px;flex:none}
h1{font-size:30px;margin:0;line-height:1;color:var(--navy)}
h1 span{color:var(--navy2);font-size:13px;margin-left:8px;font-family:Inter,sans-serif;font-weight:600;vertical-align:middle;background:var(--sky);padding:3px 10px;border-radius:99px}
.sub{color:var(--mut);font-size:12.5px;margin-top:5px}
.hr{margin-left:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:99px;background:var(--card);border:1px solid var(--bd);font-size:12.5px;color:var(--mut)}
.dot{width:9px;height:9px;border-radius:50%;background:var(--mut)}.dot.on{background:var(--grn);animation:ping 1.8s infinite}.dot.lv{background:var(--navy2);animation:ping2 1.4s infinite}.dot.w{background:var(--amb)}
@keyframes ping{0%{box-shadow:0 0 0 0 rgba(27,158,107,.5)}100%{box-shadow:0 0 0 9px rgba(27,158,107,0)}}@keyframes ping2{0%{box-shadow:0 0 0 0 rgba(47,86,160,.5)}100%{box-shadow:0 0 0 9px rgba(47,86,160,0)}}
button,.btn{background:var(--navy);color:#fff;border:0;border-radius:99px;padding:8px 15px;font:inherit;font-weight:800;cursor:pointer;transition:transform .12s,box-shadow .12s;box-shadow:none}
button:hover{background:var(--navy2)}
button.g{background:var(--card);color:var(--navy);border:1px solid var(--bd);box-shadow:none}button.g:hover{background:var(--bg2)}
button:disabled{opacity:.5}
input[type=number],input[type=text]{background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:12px;padding:7px 10px;font:inherit;min-width:0}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:10px 14px;margin:14px 0;box-shadow:var(--shadow);font-size:12.5px;color:var(--mut)}
.bar b{color:var(--tx)}
.tape{overflow-x:auto;white-space:nowrap;background:var(--navy);color:#dfe7f6;border-radius:10px;padding:8px 0;margin-bottom:14px;scrollbar-width:thin}
.tape div{display:inline-block}.tk{margin:0 16px;font-size:12.5px}
.tape .p{color:#7ee2b4}.tape .n{color:#ff9fb0}
@keyframes mq{to{transform:translateX(-50%)}}

/* live banner */
.live{border:1px solid var(--navy2);background:var(--sky);border-radius:12px;padding:13px 16px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px 22px;align-items:center;font-size:13px;color:var(--mut)}
.live b{color:var(--tx);font-size:15px}.live .lt{font:600 15px Inter,sans-serif;color:var(--navy2);display:flex;gap:8px;align-items:center}
.tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:800}
.tag.j{background:#fde4e8;color:var(--red)}.tag.b{background:#dcf3e9;color:var(--grn)}.tag.h{background:var(--sky);color:var(--navy2)}.tag.a{background:#fbf0d9;color:var(--amb)}.tag.x{background:var(--bg2);color:var(--mut)}

/* KPI (logika AFL) */
.sec{margin:22px 2px 10px;font:700 16px Inter,sans-serif;color:var(--navy)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:12px}
.k{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px 15px;box-shadow:var(--shadow);transition:transform .15s;position:relative;overflow:hidden}
.k .t{font-size:11.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;font-weight:800;padding-right:26px}
.k .v{font-size:27px;margin:4px 0 2px}
.k .d{font-size:11.5px;color:var(--mut)}
.pb{height:9px;background:var(--bg2);border-radius:9px;overflow:hidden;margin:8px 0 4px}
.pb i{display:block;height:100%;background:linear-gradient(90deg,var(--navy2),var(--grn));border-radius:9px;transition:width .6s}

/* panel */
.row{display:grid;grid-template-columns:2fr 1.25fr;gap:12px;margin-top:12px}
@media(max-width:860px){.row{grid-template-columns:minmax(0,1fr)}}
.pan{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:15px;min-width:0;box-shadow:var(--shadow);margin-top:12px}
.row .pan{margin-top:0}
.pan h2{font-size:16px;margin:0 0 10px;color:var(--navy);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pan h2 small{font:600 12px Inter,sans-serif;color:var(--mut)}
.seg{display:inline-flex;background:var(--bg2);border-radius:99px;padding:3px;margin-left:auto;flex-wrap:wrap}
.seg button{background:none;color:var(--mut);box-shadow:none;padding:5px 12px;font-size:12px}
.seg button.on{background:var(--navy);color:#fff}
.sc{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th,td{text-align:right;padding:7px 9px;border-bottom:1px solid var(--bd);white-space:nowrap;font-size:13px}
th:first-child,td:first-child{text-align:left}
th{font-size:11.5px;color:var(--mut);font-weight:800;text-transform:uppercase;letter-spacing:.03em;border-bottom:1px solid var(--bd)}
tbody tr:hover td{background:var(--sky)}
.x{background:none;color:var(--mut);padding:0 6px;font-size:16px;box-shadow:none}
svg text{fill:var(--mut);font-size:10.5px;font-family:Inter,sans-serif}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mut);margin-top:6px}
.legend span:before{content:"";display:inline-block;width:12px;height:4px;border-radius:2px;background:var(--c);margin-right:6px;vertical-align:middle}

/* tabel bulanan */
.mg td,.mg th{text-align:center;padding:6px 5px;font-size:12px;border:0}
.mg td{border:3px solid var(--card);border-radius:10px}
.mg td.y{text-align:left;font-weight:800}
.mg td.rek{box-shadow:inset 0 0 0 2px var(--navy)}
.mg tbody tr:hover td{background:inherit}
.yb{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:8px;margin-top:12px}
.yc{background:var(--bg);border-radius:14px;padding:8px;text-align:center;font-size:12px}
.yc b{display:block;font:600 16px Inter,sans-serif}
.yc i{display:block;height:46px;position:relative;margin:4px 0}
.yc i:after{content:"";position:absolute;left:30%;right:30%;bottom:50%;height:var(--h);background:var(--c);border-radius:6px 6px 2px 2px;transform-origin:bottom}
.yc i.neg:after{bottom:auto;top:50%;border-radius:2px 2px 6px 6px}
.yc i:before{content:"";position:absolute;left:8%;right:8%;top:50%;border-top:1px dashed var(--bd)}

.note{font-size:12px;color:var(--mut);margin-top:8px;line-height:1.55}
.ld{display:flex;flex-direction:column;align-items:center;gap:10px;padding:60px 16px;color:var(--mut);text-align:center}
.spin{width:32px;height:32px;border-radius:50%;border:3px solid var(--bd);border-top-color:var(--navy);animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
@media(max-width:560px){h1{font-size:25px}.k .v{font-size:22px}.hr{margin-left:0;width:100%}}
.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:15px;min-width:0;box-shadow:var(--shadow);margin-top:12px}
.card h2,main h2{font-size:16px;margin:18px 0 10px;color:var(--navy)}.card h2:first-child{margin-top:0}
.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:12px;margin-top:14px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px 15px;box-shadow:var(--shadow);position:relative;overflow:hidden}
.kpi .emo{display:none}.kpi .lbl{font-size:11.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;font-weight:800}
.kpi .val{font:700 27px Inter,system-ui,sans-serif;margin:4px 0 2px;font-variant-numeric:tabular-nums}.kpi .sub{font-size:11.5px;color:var(--mut);margin-top:0}
.up{color:var(--grn)}.down{color:var(--red)}.m{color:var(--mut);font-size:12.5px;line-height:1.55}a{color:var(--navy2)}
.sc{overflow:auto;max-height:440px}.sc th{position:sticky;top:0;background:var(--card)}
.intro{margin:14px 0 0}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0f1522;--bg2:#1a2336;--card:#162033;--tx:#e4e9f3;--mut:#9aa6bf;--bd:#2a3550;--navy:#9dbbf0;--navy2:#7ea6ea;--sky:#1d2b47;--grn:#37c48d;--red:#f0718a;color-scheme:dark}}
:root[data-theme=dark]{--bg:#0f1522;--bg2:#1a2336;--card:#162033;--tx:#e4e9f3;--mut:#9aa6bf;--bd:#2a3550;--navy:#9dbbf0;--navy2:#7ea6ea;--sky:#1d2b47;--grn:#37c48d;--red:#f0718a;color-scheme:dark}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .logo{background:#2f56a0}}`;
