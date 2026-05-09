const SHEET_ID =
"1Wp3-ERgPNgQTYEHNsHE0aS6upQckzjJIptm6jK4oU94";

const SHEET_NAME = "material";

async function loadMaterial() {

  const url =
  `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  const res = await fetch(url);
  const data = await res.json();

  const tbody =
  document.getElementById("dataMaterial");

  tbody.innerHTML = "";

  let no = 1;

  data.forEach(item => {

    // FORMAT TANGGAL INDONESIA
    const tgl = new Date(item.tanggal)
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    tbody.innerHTML += `
      <tr>
        <td>${no++}</td>
        <td>${tgl}</td>
        <td>${item.nama}</td>
        <td>${item.keterangan}</td>
        <td>${item.jumlah}</td>
      </tr>
    `;

  });

}

loadMaterial();