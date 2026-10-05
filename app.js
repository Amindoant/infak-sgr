// ===============================================
// HALAMAN INFAK & DONATUR
// ===============================================
let DATA_INFAK = [], DATA_DONATUR = [];

async function loadData() {
  const st = document.getElementById("pageStatus");
  SGR.status(st, "loading", "Memuat data infak…");
  let data;
  try {
    data = await SGR.fetchSheet(CONFIG.SHEET.pemasukan);
  } catch (e) {
    SGR.status(st, "error", e.message, loadData);
    return;
  }
  SGR.status(st, "clear");

  SGR.prepDates(data);
  data.forEach((r, i) => {
    r._i = i;
    r._jumlah = SGR.parseNumber(r.jumlah);
    r._jenis = String(r.jenis || "infak").trim().toLowerCase();
    r._metode = SGR.metodeInfak(r);
    r._cari = [r.keterangan, SGR.tgl(r._date), r._metode, r.pekan_ke ? "ke-" + r.pekan_ke : ""].join(" ").toLowerCase();
  });
  DATA_INFAK = data.filter(r => r._jenis !== "donatur");
  DATA_DONATUR = data.filter(r => r._jenis === "donatur");

  // ---- Ringkasan ----
  const sum = rows => rows.reduce((a, r) => a + r._jumlah, 0);
  const tInfak = sum(DATA_INFAK), tDon = sum(DATA_DONATUR);
  const qris = DATA_INFAK.filter(r => r._metode === "QRIS");
  const nPekan = new Set(DATA_INFAK.map(r => r.pekan_ke || (r._date && r._date.getTime()))).size;
  setText("totalInfak", SGR.angka(tInfak));
  setText("totalDonatur", SGR.angka(tDon));
  setText("grandTotal", SGR.angka(tInfak + tDon));
  setText("totalQris", SGR.rupiah(sum(qris)));
  setText("statPekan", `${nPekan} kali Jumat`);
  setText("statQris", qris.length ? `${qris.length} pekan sejak QRIS tersedia` : "Belum ada");
  setText("statDonatur", `${DATA_DONATUR.length} kali sumbangan`);

  const dates = data.map(r => r._date).filter(Boolean);
  if (dates.length) {
    setText("periode", `Periode: ${SGR.tgl(new Date(Math.min(...dates)))} s/d ${SGR.tgl(new Date(Math.max(...dates)))}`);
  }
  render();
}

function render() {
  const q = document.getElementById("cari").value.trim().toLowerCase();
  const baru = document.getElementById("urut").value === "baru";
  const sortFn = (a, b) => ((a._date || 0) - (b._date || 0)) * (baru ? -1 : 1) || a._i - b._i;
  const match = r => !q || r._cari.includes(q);

  // ---- Infak: dikelompokkan per bulan ----
  const infak = DATA_INFAK.filter(match).sort(sortFn);
  const tbI = document.getElementById("dataInfak");
  if (!infak.length) {
    tbI.innerHTML = `<tr><td colspan="5" class="empty-cell">${q ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data infak."}</td></tr>`;
  } else {
    let html = "", bulan = null;
    const subtotal = {};
    infak.forEach(r => { const k = SGR.keyBulan(r._date); subtotal[k] = (subtotal[k] || 0) + r._jumlah; });
    infak.forEach(r => {
      const k = SGR.keyBulan(r._date);
      if (k !== bulan) {
        bulan = k;
        html += `<tr class="month-row"><td colspan="5"><span>${SGR.namaBulan(k)}</span><span>${SGR.rupiah(subtotal[k])}</span></td></tr>`;
      }
      html += `<tr>
        <td class="tgl">${SGR.tgl(r._date)}</td>
        <td class="ket">${SGR.esc(r.keterangan)}</td>
        <td><span class="badge ${r._metode === "QRIS" ? "badge-qris" : "badge-tunai"}">${SGR.esc(r._metode)}</span></td>
        <td class="num">${SGR.rupiah(r._jumlah)}</td>
        <td>${SGR.thumb(r.foto, "Bukti infak")}</td>
      </tr>`;
    });
    tbI.innerHTML = html;
  }

  // ---- Donatur ----
  const don = DATA_DONATUR.filter(match).sort(sortFn);
  const tbD = document.getElementById("dataDonatur");
  tbD.innerHTML = don.length ? don.map((r, i) => `<tr>
      <td>${i + 1}</td>
      <td class="tgl">${SGR.tgl(r._date)}</td>
      <td class="ket">${SGR.esc(String(r.keterangan || "").replace(/^Donatur\s+(dari\s+)?/i, ""))}</td>
      <td class="num">${SGR.rupiah(r._jumlah)}</td>
      <td>${SGR.thumb(r.foto, "Bukti donasi")}</td>
    </tr>`).join("")
    : `<tr><td colspan="5" class="empty-cell">${q ? "Tidak ada donatur yang cocok dengan pencarian." : "Belum ada data donatur."}</td></tr>`;
}

function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

document.getElementById("cari").addEventListener("input", render);
document.getElementById("urut").addEventListener("change", render);
document.getElementById("btnRefresh").addEventListener("click", loadData);
window.loadData = loadData;
loadData();
