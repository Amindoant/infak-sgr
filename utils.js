// ===============================================
// FUNGSI BERSAMA UNTUK SEMUA HALAMAN
// ===============================================
const SGR = (() => {

  const BULAN = ["Januari","Februari","Maret","April","Mei","Juni",
                 "Juli","Agustus","September","Oktober","November","Desember"];

  // ---------- Ambil data dari Google Sheet ----------
  async function fetchSheet(name, { timeout = 20000 } = {}) {
    const url = `https://opensheet.elk.sh/${CONFIG.SHEET_ID}/${encodeURIComponent(name)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`Server data membalas ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error(data && data.error ? data.error : "Format data tidak dikenali");
      return data;
    } catch (e) {
      if (e.name === "AbortError") throw new Error("Server data terlalu lama merespons");
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  // Untuk sheet tambahan (rab, saldo): kalau belum ada, kembalikan [] tanpa error
  async function fetchOptional(name) {
    try { return await fetchSheet(name); } catch { return []; }
  }

  // ---------- Angka ----------
  // Aman untuk "1015500", "1.015.500", "1,015,500", "Rp 1.015.500,00", angka biasa
  function parseNumber(v) {
    if (typeof v === "number") return v;
    if (v === undefined || v === null) return 0;
    let s = String(v).replace(/[^\d.,-]/g, "");
    if (!s) return 0;
    const hasDot = s.includes("."), hasComma = s.includes(",");
    if (hasDot && hasComma) {
      // pemisah yang paling akhir = desimal
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (hasDot || hasComma) {
      const sep = hasDot ? "." : ",";
      const re = new RegExp(`^-?\\d{1,3}(\\${sep}\\d{3})+$`);
      if (re.test(s)) s = s.split(sep).join("");      // pemisah ribuan
      else s = s.replace(",", ".");                     // pemisah desimal
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  const rupiah = n => "Rp " + Math.round(n).toLocaleString("id-ID");
  const angka  = n => Number(n).toLocaleString("id-ID");

  // Ringkas: Rp 52,2 jt
  function rupiahSingkat(n) {
    if (Math.abs(n) >= 1e9) return "Rp " + (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M";
    if (Math.abs(n) >= 1e6) return "Rp " + (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
    if (Math.abs(n) >= 1e3) return "Rp " + (n / 1e3).toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " rb";
    return rupiah(n);
  }

  // ---------- Tanggal ----------
  // Mendeteksi format sekali untuk seluruh kolom, supaya 03/04 tidak salah dibaca.
  function prepDates(rows, field = "tanggal") {
    let order = "MDY";
    const slash = rows.map(r => String(r[field] || "").trim())
                      .filter(s => /^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/.test(s));
    if (slash.some(s => +s.split(/[\/.-]/)[0] > 12)) order = "DMY";
    else if (slash.some(s => +s.split(/[\/.-]/)[1] > 12)) order = "MDY";

    rows.forEach(r => { r._date = parseDate(r[field], order); });
    return rows;
  }

  function parseDate(v, order = "MDY") {
    if (v === undefined || v === null || v === "") return null;
    const s = String(v).trim();
    let m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1], m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/))) {
      let y = +m[3]; if (y < 100) y += 2000;
      return order === "DMY" ? new Date(y, m[2] - 1, +m[1]) : new Date(y, m[1] - 1, +m[2]);
    }
    if (/^\d{5}(\.\d+)?$/.test(s)) {                // nomor seri tanggal spreadsheet
      const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 86400000);
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  const tgl = d => d ? d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-";
  const tglPendek = d => d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-";
  const hariTgl = d => d ? d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-";
  const keyBulan = d => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "0000-00";
  const namaBulan = key => { const [y, m] = key.split("-"); return `${BULAN[+m - 1] || "?"} ${y}`; };

  // ---------- Teks ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function imgur(url) {
    url = String(url || "").trim();
    if (url.includes("imgur.com") && !url.includes("i.imgur.com")) {
      const id = url.split("/").pop().split(".")[0];
      return `https://i.imgur.com/${id}.jpg`;
    }
    return url;
  }

  // ---------- Kategori (cadangan bila kolom di sheet kosong) ----------
  function kategoriPengeluaran(row) {
    if (row.kategori && row.kategori.trim()) return row.kategori.trim();
    const s = String(row.keterangan || "").toLowerCase();
    if (/kopi|gula|konsumsi|tumpeng|cleo|bisaroh/.test(s)) return "Konsumsi & Acara";
    if (/tukang|kuli/.test(s)) return "Upah";
    if (/print|banner|stiker|proposal|kotak infak/.test(s)) return "Administrasi";
    if (/bensin/.test(s)) return "Operasional";
    return "Material & Alat";
  }

  function metodeInfak(row) {
    if (row.metode && row.metode.trim()) return row.metode.trim();
    return /qris/i.test(row.keterangan || "") ? "QRIS" : "Tunai";
  }

  // ---------- Tampilan ----------
  function status(el, type, msg, retry) {
    if (!el) return;
    if (type === "loading") {
      el.innerHTML = `<div class="status-box"><div class="spinner small"></div><span>${esc(msg || "Memuat data…")}</span></div>`;
    } else if (type === "error") {
      el.innerHTML = `<div class="status-box error">
        <strong>Data belum bisa dimuat.</strong>
        <span>${esc(msg)}. Periksa koneksi internet lalu coba lagi.</span>
        ${retry ? '<button class="btn-refresh" type="button">Coba lagi</button>' : ""}
      </div>`;
      if (retry) el.querySelector("button").onclick = retry;
    } else if (type === "empty") {
      el.innerHTML = `<div class="status-box"><span>${esc(msg)}</span></div>`;
    } else {
      el.innerHTML = "";
    }
  }

  function showImage(url) {
    const modal = document.createElement("div");
    modal.className = "modal-nota";
    modal.setAttribute("role", "dialog");
    modal.innerHTML = `<button class="close-btn" type="button" aria-label="Tutup">&times;</button>
      <img src="${esc(url)}" class="modal-image" alt="Foto bukti">`;
    const close = () => { modal.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    modal.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(modal);
  }

  // Delegasi klik untuk semua gambar bukti: <img data-zoom="url">
  document.addEventListener("click", e => {
    const img = e.target.closest("[data-zoom]");
    if (img) showImage(img.dataset.zoom);
  });

  function thumb(url, alt = "Bukti") {
    url = imgur(url);
    if (!url) return "-";
    return `<img src="${esc(url)}" alt="${esc(alt)}" class="foto-img" loading="lazy" data-zoom="${esc(url)}">`;
  }

  // Tombol bagikan ke WhatsApp
  function share(text) {
    if (navigator.share) {
      navigator.share({ title: "Pembangunan Musholla SGR", text, url: CONFIG.SITE_URL }).catch(() => {});
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n\n" + CONFIG.SITE_URL), "_blank");
    }
  }

  return { fetchSheet, fetchOptional, parseNumber, rupiah, rupiahSingkat, angka,
           prepDates, parseDate, tgl, tglPendek, hariTgl, keyBulan, namaBulan,
           esc, imgur, kategoriPengeluaran, metodeInfak, status, showImage, thumb, share };
})();
