const SHEET_ID = "1Wp3-ERgPNgQTYEHNsHE0aS6upQckzjJIptm6jK4oU94";
const SHEET_NAME = "dokumentasi";

async function loadDokumentasi(){

    const url=`https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

    const res=await fetch(url);

    const data=await res.json();

    const gallery=document.getElementById("gallery");

    gallery.innerHTML="";

    // Group berdasarkan tanggal + keterangan
    const groups={};

    data.forEach(item=>{

        const key=item.tanggal+"_"+item.keterangan;

        if (!groups[key]) {

		groups[key] = {
        tanggal: item.tanggal,
        keterangan: item.keterangan,
        fotos: [],
        video: ""
		};

		}

		// Simpan video jika ada
		if (item.video && item.video.trim() !== "") {
		groups[key].video = item.video.trim();
		}
        if(item.foto){

            let foto=item.foto;

            if(foto.includes("imgur.com") && !foto.includes("i.imgur.com")){

                const id=foto.split("/").pop().split(".")[0];

                foto=`https://i.imgur.com/${id}.jpg`;

            }

            groups[key].fotos.push(foto);

        }

    });

    Object.values(groups).forEach(item=>{

        let html=`
        <div class="timeline-card">

            <div class="tanggal">
                📅 ${item.tanggal}
            </div>

            <h3>${item.keterangan}</h3>

            <div class="foto-grid">
        `;

        item.fotos.forEach(foto=>{

            html+=`
            <img
            src="${foto}"
            onclick="showFoto('${foto}')">
            `;

        });

        html+=`</div>`;
		
		console.log(item);
		console.log("Video =", item.video);
        if(item.video){

            const videoId = getYoutubeId(item.video);

			if(videoId){

			html += `
			<div class="video">
			<iframe
            src="https://www.youtube.com/embed/${videoId}"
            title="Video Dokumentasi"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
			</iframe>
		</div>
		`;
		}

        }

        html+=`</div>`;

        gallery.innerHTML+=html;

    });

}

function getYoutubeId(url) {

    if (!url) return "";

    // Shorts
    if (url.includes("/shorts/")) {
        return url.split("/shorts/")[1].split("?")[0];
    }

    // youtu.be
    if (url.includes("youtu.be/")) {
        return url.split("youtu.be/")[1].split("?")[0];
    }

    // watch?v=
    if (url.includes("watch?v=")) {
        return url.split("watch?v=")[1].split("&")[0];
    }

    return "";
}

function showFoto(url){

    const modal=document.createElement("div");

    modal.className="modal-nota";

    modal.innerHTML=`
        <img src="${url}" class="modal-image">
    `;

    modal.onclick=()=>modal.remove();

    document.body.appendChild(modal);

}

loadDokumentasi();