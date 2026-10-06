// ===============================================
// DASHBOARD
// ===============================================
const WARNA = {
  hijau: "#2E7D32", merah: "#C62828", oranye: "#EF8F00",
  biru: "#1565C0", ungu: "#6A1B9A", abu: "#90A4AE"
};
const WARNA_KATEGORI = {
  "Upah": "#2E7D32", "Material & Alat": "#EF8F00", "Konsumsi & Acara": "#1565C0",
  "Administrasi": "#6A1B9A", "Operasional": "#90A4AE"
};
const charts = {};

async function loadDashboard() {
  const statusEl = document.getElementById("dashStatus");
  SGR.status(statusEl, "loading", "Memuat laporan keuangan…");

  let masuk, keluar, material, rab, saldo;
  try {
    [masuk, keluar, material, rab, saldo] = await Promise.all([
      SGR.fetchSheet(CONFIG.SHEET.pemasukan),
      SGR.fetchSheet(CONFIG.SHEET.pengeluaran),
      SGR.fetchOptional(CONFIG.SHEET.material),
      SGR.fetchOptional(CONFIG.SHEET.rab),
      SGR.fetchOptional(CONFIG.SHEET.saldo)
    ]);
  } catch (e) {
    SGR.status(statusEl, "error", e.message, loadDashboard);
    setText("updateInfo", "");
    return;
  }
  SGR.status(statusEl, "clear");

  SGR.prepDates(masuk); SGR.prepDates(keluar); SGR.prepDates(material);
  masuk.forEach(r => {
    r._jumlah = SGR.parseNumber(r.jumlah);
    r._jenis = String(r.jenis || "infak").trim().toLowerCase();
    r._metode = SGR.metodeInfak(r);
  });
  keluar.forEach(r => {
    r._jumlah = SGR.parseNumber(r.jumlah);
    r._kategori = SGR.kategoriPengeluaran(r);
  });

  const totalMasuk = sum(masuk), totalKeluar = sum(keluar), saldoAkhir = totalMasuk - totalKeluar;
  const infak = masuk.filter(r => r._jenis !== "donatur");
  const donatur = masuk.filter(r => r._jenis === "donatur");

  // ---- Kartu ringkasan ----
  setText("totalMasuk", SGR.angka(totalMasuk));
  setText("totalKeluar", SGR.angka(totalKeluar));
  setText("saldoAkhir", SGR.angka(saldoAkhir));
  setText("noteMasuk", `Infak Jumat ${SGR.rupiahSingkat(sum(infak))}, donatur ${SGR.rupiahSingkat(sum(donatur))}`);
  setText("noteKeluar", `${keluar.length} transaksi tercatat lengkap`);

  // ---- Update terakhir ----
  const last = maxDate([...masuk, ...keluar]);
  if (last) {
    const lastKeluar = maxDate(keluar);
    let txt = `Data diperbarui sampai ${SGR.hariTgl(last)}`;
    if (lastKeluar) txt += `. Pengeluaran terakhir dicatat ${SGR.tgl(lastKeluar)}`;
    setText("updateInfo", txt + ".");
  }

  renderMaterialHighlight(material);
  renderTarget(rab, totalMasuk);
  const pekan = renderJumat(infak);
  renderTahap(rab);
  renderSaldo(saldo, saldoAkhir);

  if (window.Chart) {
    Chart.defaults.font.family = "Arial, sans-serif";
    Chart.defaults.color = "#444";
    chartBulanan(masuk, keluar);
    chartKategori(keluar, totalKeluar);
    chartSumber(infak, donatur, totalMasuk);
    chartJumat(pekan);
  } else {
    document.querySelectorAll(".chart-box").forEach(el => {
      el.innerHTML = '<p class="panel-sub">Grafik tidak bisa dimuat. Muat ulang halaman untuk mencoba lagi.</p>';
    });
  }

  document.getElementById("shareBtn").onclick = () => {
    const lp = pekan[pekan.length - 1];
    let text = `Assalamu'alaikum Wr.Wb\n\n` +
      `Berikut Laporan Pembangunan Musholla SGR\n\n` +
      `Total pemasukan: ${SGR.rupiah(totalMasuk)}\n` +
      `Total pengeluaran: ${SGR.rupiah(totalKeluar)}\n` +
      `Sisa saldo: ${SGR.rupiah(saldoAkhir)}`;
    if (lp) text += `\n\nInfak Jumat ke-${lp.ke} (${SGR.tgl(lp.date)}): ${SGR.rupiah(lp.total)}`;
    text += `\n\nRincian lengkap, foto nota, dan dokumentasi ada di website. Jazakumullah khairan.`;
    SGR.share(text);
  };
}

// ---------- Bagian-bagian ----------
function renderMaterialHighlight(material) {
  if (!material.length) return;
  const rekap = {};
  material.forEach(r => {
    let jumlah = r.jumlah, satuan = r.satuan;
    if (!satuan) {                                   // format lama "25 sak"
      const m = String(jumlah || "").match(/^([\d.,]+)\s*(.*)$/);
      jumlah = m ? m[1] : jumlah; satuan = m ? m[2] : "";
    }
    const key = String(r.nama || "").trim().toLowerCase() + "|" + String(satuan).trim().toLowerCase();
    rekap[key] = (rekap[key] || 0) + SGR.parseNumber(jumlah);
  });
  const parts = [];
  if (rekap["semen|sak"]) parts.push(`${SGR.angka(rekap["semen|sak"])} sak semen`);
  if (rekap["bata merah|biji"]) parts.push(`${SGR.angka(rekap["bata merah|biji"])} bata merah`);
  const nDonatur = new Set(material.map(r => String(r.keterangan || "").trim().toLowerCase())).size;
  setText("materialHighlight", parts.length
    ? `Sudah terkumpul ${parts.join(" dan ")}, serta material lain dari ${nDonatur} donatur.`
    : `${material.length} sumbangan material dari ${nDonatur} donatur.`);
}

function renderTarget(rab, terkumpul) {
  const target = rab.reduce((a, r) => a + SGR.parseNumber(r.perkiraan_biaya), 0);
  if (!target) return;
  const pct = Math.min(100, terkumpul / target * 100);
  const kurang = Math.max(0, target - terkumpul);
  document.getElementById("targetPanel").hidden = false;
  setText("targetSub", `Perkiraan biaya seluruh tahap ${SGR.rupiah(target)}`);
  setText("targetPercent", pct.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "%");
  setText("targetTerkumpul", SGR.rupiah(terkumpul));
  setText("targetKurang", kurang ? SGR.rupiah(kurang) : "Target tercapai, alhamdulillah");
  document.getElementById("targetBar").setAttribute("aria-valuenow", pct.toFixed(0));
  requestAnimationFrame(() => { document.getElementById("targetFill").style.width = pct + "%"; });
}

function renderJumat(infak) {
  // gabungkan tunai + QRIS dalam satu pekan
  const map = {};
  infak.forEach(r => {
    const ke = r.pekan_ke ? SGR.parseNumber(r.pekan_ke) : null;
    const key = ke ? "p" + ke : "d" + (r._date ? r._date.getTime() : 0);
    if (!map[key]) map[key] = { ke, date: r._date, total: 0, tunai: 0, qris: 0 };
    const p = map[key];
    p.total += r._jumlah;
    if (r._metode === "QRIS") p.qris += r._jumlah; else p.tunai += r._jumlah;
    if (r._date && (!p.date || r._date < p.date)) p.date = r._date;
  });
  const pekan = Object.values(map).sort((a, b) => (a.date || 0) - (b.date || 0));
  pekan.forEach((p, i) => { if (!p.ke) p.ke = i + 1; });
  if (!pekan.length) return pekan;

  const lp = pekan[pekan.length - 1];
  const rata = pekan.reduce((a, p) => a + p.total, 0) / pekan.length;
  document.getElementById("jumatPanel").hidden = false;
  setText("jumatSub", `Pekan ke-${lp.ke}, ${SGR.hariTgl(lp.date)}`);
  setText("jumatAngka", SGR.rupiah(lp.total));
  const selisih = lp.total - rata;
  let banding = `${SGR.rupiah(Math.abs(selisih))} ${selisih >= 0 ? "di atas" : "di bawah"} rata-rata ${SGR.rupiah(rata)} per pekan.`;
  if (lp.qris) banding += ` Termasuk ${SGR.rupiah(lp.qris)} lewat QRIS.`;
  setText("jumatBanding", banding);
  setText("jumatRata", `${pekan.length} pekan tercatat, rata-rata ${SGR.rupiah(rata)} per Jumat.`);
  return pekan;
}

function renderTahap(rab) {
  const rows = rab.filter(r => String(r.tahap || "").trim());
  if (!rows.length) return;
  rows.sort((a, b) => SGR.parseNumber(a.urutan) - SGR.parseNumber(b.urutan));
  const LABEL = { selesai: "Selesai", proses: "Sedang dikerjakan", belum: "Belum dimulai" };
  document.getElementById("tahapList").innerHTML = rows.map(r => {
    const st = String(r.status || "belum").trim().toLowerCase();
    const cls = LABEL[st] ? st : "belum";
    const biaya = SGR.parseNumber(r.perkiraan_biaya);
    return `<li class="tahap ${cls}">
      <span class="tahap-dot" aria-hidden="true"></span>
      <div class="tahap-body">
        <strong>${SGR.esc(r.tahap)}</strong>
        <span class="tahap-status">${LABEL[cls]}${biaya ? `, perkiraan ${SGR.rupiahSingkat(biaya)}` : ""}</span>
        ${r.keterangan ? `<span class="tahap-ket">${SGR.esc(r.keterangan)}</span>` : ""}
      </div>
    </li>`;
  }).join("");
  document.getElementById("tahapPanel").hidden = false;
}

function renderSaldo(saldo, saldoHitung) {
  const rows = saldo.filter(r => String(r.lokasi || "").trim() && String(r.jumlah ?? "").trim() !== "");
  if (!rows.length) return;
  SGR.prepDates(rows, "per_tanggal");
  const total = rows.reduce((a, r) => a + SGR.parseNumber(r.jumlah), 0);
  const per = maxDate(rows);
  document.getElementById("saldoList").innerHTML = rows.map(r => `
    <div class="saldo-item"><span>${SGR.esc(r.lokasi)}</span><strong>${SGR.rupiah(SGR.parseNumber(r.jumlah))}</strong></div>`).join("") +
    `<div class="saldo-item total"><span>Jumlah</span><strong>${SGR.rupiah(total)}</strong></div>`;
  setText("saldoSub", per ? `Posisi per ${SGR.tgl(per)}` : "");
  const beda = total - saldoHitung;
  setText("saldoCek", Math.abs(beda) < 1
    ? "Cocok dengan sisa saldo hasil hitungan pemasukan dikurangi pengeluaran."
    : `Ada selisih ${SGR.rupiah(Math.abs(beda))} dengan sisa saldo hasil hitungan. Bendahara sedang mencocokkan.`);
  document.getElementById("saldoPanel").hidden = false;
}

// ---------- Grafik ----------
function chartBulanan(masuk, keluar) {
  const keys = [...new Set([...masuk, ...keluar].filter(r => r._date).map(r => SGR.keyBulan(r._date)))].sort();
  const byMonth = rows => keys.map(k => rows.filter(r => r._date && SGR.keyBulan(r._date) === k).reduce((a, r) => a + r._jumlah, 0));
  const labels = keys.map(k => { const [y, m] = k.split("-"); return new Date(+y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }); });
  make("chartBulanan", {
    type: "bar",
    data: { labels, datasets: [
      { label: "Pemasukan", data: byMonth(masuk), backgroundColor: WARNA.hijau, borderRadius: 4 },
      { label: "Pengeluaran", data: byMonth(keluar), backgroundColor: WARNA.merah, borderRadius: 4 }
    ]},
    options: { ...base(), scales: { y: { ticks: { callback: v => SGR.rupiahSingkat(v) } }, x: { grid: { display: false } } } }
  });
}

function chartKategori(keluar, total) {
  const g = {};
  keluar.forEach(r => { g[r._kategori] = (g[r._kategori] || 0) + r._jumlah; });
  const ent = Object.entries(g).sort((a, b) => b[1] - a[1]);
  const extra = [WARNA.biru, WARNA.ungu, WARNA.abu];
  const colors = ent.map(([k], i) => WARNA_KATEGORI[k] || extra[i % 3]);
  donut("chartKategori", ent, colors);
  legend("legendKategori", ent, colors, total);
}

function chartSumber(infak, donatur, total) {
  const ent = [
    ["Infak Jumat tunai", infak.filter(r => r._metode !== "QRIS").reduce((a, r) => a + r._jumlah, 0), WARNA.hijau],
    ["Infak Jumat QRIS", infak.filter(r => r._metode === "QRIS").reduce((a, r) => a + r._jumlah, 0), WARNA.biru],
    ["Donatur", sum(donatur), WARNA.oranye]
  ].filter(e => e[1] > 0);
  const colors = ent.map(e => e[2]);
  donut("chartSumber", ent, colors);
  legend("legendSumber", ent, colors, total);
}

function chartJumat(pekan) {
  if (!pekan.length) return;
  const datasets = [{ label: "Tunai", data: pekan.map(p => p.tunai), backgroundColor: WARNA.hijau, stack: "s", borderRadius: 3 }];
  if (pekan.some(p => p.qris)) datasets.push({ label: "QRIS", data: pekan.map(p => p.qris), backgroundColor: WARNA.biru, stack: "s", borderRadius: 3 });
  const opt = base();
  opt.scales = {
    x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
    y: { stacked: true, ticks: { callback: v => SGR.rupiahSingkat(v) } }
  };
  opt.plugins.tooltip.callbacks.title = items => { const p = pekan[items[0].dataIndex]; return `Jumat ke-${p.ke}, ${SGR.tgl(p.date)}`; };
  opt.plugins.tooltip.callbacks.footer = items => `Total: ${SGR.rupiah(pekan[items[0].dataIndex].total)}`;
  make("chartJumat", { type: "bar", data: { labels: pekan.map(p => `${p.ke}`), datasets }, options: opt });
}

// ---------- Pembantu grafik ----------
function base() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } },
      tooltip: { callbacks: { label: c => `${c.dataset.label}: ${SGR.rupiah(c.raw)}` } }
    }
  };
}
function donut(id, ent, colors) {
  make(id, {
    type: "doughnut",
    data: { labels: ent.map(e => e[0]), datasets: [{ data: ent.map(e => e[1]), backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "62%",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${SGR.rupiah(c.raw)}` } } } }
  });
}
function legend(id, ent, colors, total) {
  document.getElementById(id).innerHTML = ent.map(([k, v], i) => `
    <li><span class="swatch" style="background:${colors[i]}"></span>
      <span class="legend-name">${SGR.esc(k)}</span>
      <span class="legend-val">${SGR.rupiahSingkat(v)} <em>${pctLabel(v, total)}</em></span></li>`).join("");
}
function make(id, cfg) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(document.getElementById(id), cfg);
}

// ---------- Kecil-kecil ----------
function pctLabel(v, t) { if (!t) return "0%"; const p = v / t * 100; return p > 0 && p < 1 ? "<1%" : Math.round(p) + "%"; }
function sum(rows) { return rows.reduce((a, r) => a + (r._jumlah || 0), 0); }
function maxDate(rows) { const d = rows.map(r => r._date).filter(Boolean); return d.length ? new Date(Math.max(...d)) : null; }
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

loadDashboard();
