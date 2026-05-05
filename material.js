const SHEET_ID = "1Wp3-ERgPNgQTYEHNsHE0aS6upQckzjJIptm6jK4oU94";
const SHEET_NAME = "material";

async function loadMaterial() {
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

  const res = await fetch(url);
  const data = await res.json();

  const tbody = document.getElementById("dataMaterial");
  tbody.innerHTML = "";

  data.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.tanggal}</td>
        <td>${item.nama}</td>
        <td>${item.jumlah}</td>
        <td>${item.keterangan}</td>
      </tr>
    `;
  });
}

loadMaterial();