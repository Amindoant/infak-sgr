const SHEET_ID = "1Wp3-ERgPNgQTYEHNsHE0aS6upQckzjJIptm6jK4oU94";
const SHEET_NAME = "1";

async function loadData() {
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  const res = await fetch(url);
  const data = await res.json();

  const tbodyInfak = document.getElementById("dataInfak");
  const tbodyDonatur = document.getElementById("dataDonatur");

  tbodyInfak.innerHTML = "";
  tbodyDonatur.innerHTML = "";

  let totalInfak = 0;
  let totalDonatur = 0;

  let noInfak = 1;
  let noDonatur = 1;

  let tanggalList = [];

  data.forEach(item => {
    const tanggal = item.tanggal;
    const keterangan = item.keterangan;
    const jenis = (item.jenis || "infak").toLowerCase();

    const jumlah = Number(
      (item.jumlah || "0")
        .toString()
        .replace(/[^\d]/g, "")
    );

    // simpan tanggal untuk periode
    if (tanggal) tanggalList.push(new Date(tanggal));

    // format tanggal indonesia
    const tglFormat = new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    if (jenis === "donatur") {
      tbodyDonatur.innerHTML += `
        <tr>
          <td>${noDonatur++}</td>
          <td>${tglFormat}</td>
          <td>${keterangan}</td>
          <td>Rp ${jumlah.toLocaleString()}</td>
        </tr>
      `;
      totalDonatur += jumlah;
    } else {
      tbodyInfak.innerHTML += `
        <tr>
          <td>${noInfak++}</td>
          <td>${tglFormat}</td>
          <td>${keterangan}</td>
          <td>Rp ${jumlah.toLocaleString()}</td>
        </tr>
      `;
      totalInfak += jumlah;
    }
  });

  // total
  document.getElementById("totalInfak").innerText = totalInfak.toLocaleString();
  document.getElementById("totalDonatur").innerText = totalDonatur.toLocaleString();
  document.getElementById("grandTotal").innerText =
    (totalInfak + totalDonatur).toLocaleString();

  // 🔥 HITUNG PERIODE DARI DATA
  if (tanggalList.length > 0) {
    const minDate = new Date(Math.min(...tanggalList));
    const maxDate = new Date(Math.max(...tanggalList));

    const format = (d) =>
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });

    document.getElementById("periode").innerText =
      `Periode: ${format(minDate)} s/d ${format(maxDate)}`;
  }
}

window.loadData = loadData;
loadData();