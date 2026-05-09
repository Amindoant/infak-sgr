const SHEET_ID = "1Wp3-ERgPNgQTYEHNsHE0aS6upQckzjJIptm6jK4oU94";
const SHEET_NAME = "pengeluaran";

async function loadPengeluaran() {

  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  const res = await fetch(url);
  const data = await res.json();

  const tbody = document.getElementById("dataPengeluaran");

  tbody.innerHTML = "";

  let total = 0;
  let no = 1;

  data.forEach(item => {

    const tanggal = item.tanggal;
    const keterangan = item.keterangan;

    const jumlah = Number(
      (item.jumlah || "0")
      .toString()
      .replace(/[^\d]/g, "")
    );

    tbody.innerHTML += `
      <tr>
        <td>${no++}</td>
        <td>${tanggal}</td>
        <td>${keterangan}</td>
        <td>Rp ${jumlah.toLocaleString()}</td>
      </tr>
    `;

    total += jumlah;

  });

  document.getElementById("totalPengeluaran")
    .innerText = total.toLocaleString();
}

loadPengeluaran();