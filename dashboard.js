const SHEET_ID =
"1Wp3-ERgPNgQTYEHNsHE0aS6upQckzjJIptm6jK4oU94";

async function loadDashboard() {

  // SHEET INFAK
  const infakUrl =
  `https://opensheet.elk.sh/${SHEET_ID}/1`;

  // SHEET PENGELUARAN
  const pengeluaranUrl =
  `https://opensheet.elk.sh/${SHEET_ID}/pengeluaran`;

  // AMBIL DATA
  const resInfak = await fetch(infakUrl);
  const dataInfak = await resInfak.json();

  const resKeluar = await fetch(pengeluaranUrl);
  const dataKeluar = await resKeluar.json();

  let totalMasuk = 0;
  let totalKeluar = 0;

  // HITUNG TOTAL PEMASUKAN
  dataInfak.forEach(item => {

    const jumlah = Number(
      (item.jumlah || "0")
      .toString()
      .replace(/[^\d]/g, "")
    );

    totalMasuk += jumlah;

  });

  // HITUNG TOTAL PENGELUARAN
  dataKeluar.forEach(item => {

    const jumlah = Number(
      (item.jumlah || "0")
      .toString()
      .replace(/[^\d]/g, "")
    );

    totalKeluar += jumlah;

  });

  // HITUNG SALDO
  const saldoAkhir = totalMasuk - totalKeluar;

  // TAMPILKAN KE HTML
  document.getElementById("totalMasuk").innerText =
    totalMasuk.toLocaleString("id-ID");

  document.getElementById("totalKeluar").innerText =
    totalKeluar.toLocaleString("id-ID");

  document.getElementById("saldoAkhir").innerText =
    saldoAkhir.toLocaleString("id-ID");
}

loadDashboard();