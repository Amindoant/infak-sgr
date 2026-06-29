window.addEventListener("DOMContentLoaded", () => {

const modal = document.getElementById("pdfModal");
const frame = document.getElementById("pdfFrame");
const loading = document.getElementById("loading");
const header = document.querySelector(".pdf-header");

let startY = 0;

// buka pdf
window.openPdf = function(title,id){

    document.getElementById("pdfTitle").textContent = title;

    loading.style.display = "flex";

    frame.src = `https://drive.google.com/file/d/${id}/preview`;

    modal.classList.add("show");

    document.body.style.overflow = "hidden";

};

// iframe selesai load
frame.onload = function(){

    loading.style.display = "none";

};

// tutup
window.closePdf = function(){

    modal.classList.remove("show");

    frame.src = "";

    document.body.style.overflow = "auto";

};

// fullscreen
window.fullscreenPdf = function(){

    if(frame.requestFullscreen){

        frame.requestFullscreen();

    }else if(frame.webkitRequestFullscreen){

        frame.webkitRequestFullscreen();

    }

};

// ESC
document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closePdf();

    }

});

// klik luar modal
modal.addEventListener("click",(e)=>{

    if(e.target===modal){

        closePdf();

    }

});

// swipe HP
header.addEventListener("touchstart",(e)=>{

    startY=e.touches[0].clientY;

});

header.addEventListener("touchmove",(e)=>{

    let y=e.touches[0].clientY;

    if(y-startY>120){

        closePdf();

    }

});

});