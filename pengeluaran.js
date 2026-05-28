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

    let nota = item.nota || "";

    // otomatis convert link imgur biasa
    if(nota.includes("imgur.com") && !nota.includes("i.imgur.com")){
        const id = nota.split("/").pop();
        nota = `https://i.imgur.com/${id}.jpg`;
    }

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

        <td>Rp ${jumlah.toLocaleString('id-ID')}</td>

        <td>
          ${
            nota
            ? `
              <img
                src="${nota}"
                alt="Nota"
                class="nota-img"
                onclick="showNota('${nota}')"
              >
            `
            : '-'
          }
        </td>

      </tr>
    `;

    total += jumlah;

  });

  document.getElementById("totalPengeluaran")
    .innerText = total.toLocaleString('id-ID');
}


function showNota(url){

  const modal = document.createElement('div');

  modal.className = "modal-nota";

  modal.innerHTML = `
      <span class="close-btn">&times;</span>
      <img src="${url}" class="modal-image">
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', () => {
      modal.remove();
  });

}

loadPengeluaran();
