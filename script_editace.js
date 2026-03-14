// --- LOGIKA MENU A PANELŮ ---
//kurzor
const kurzor = document.getElementById("kurzor");
 
document.addEventListener("mousemove", (e) => {
    kurzor.style.left = (e.pageX - 20) + "px";
    kurzor.style.top = (e.pageY - 10) + "px";
});
 
const menu = document.getElementById("sideMenu");
document.getElementById("openMenu").onclick = () => {
    menu.classList.add("open");
};
document.getElementById("closeMenu").onclick = () => {
    menu.classList.remove("open");
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
};
 
const panels = document.querySelectorAll(".panel");
function showPanel(id) {
    panels.forEach(p => p.classList.add("hidden"));
    if(id) document.getElementById("panel-" + id).classList.remove("hidden");
}
 
document.querySelectorAll(".menu-item[data-panel]").forEach(btn => {
    btn.onclick = () => showPanel(btn.dataset.panel);
});
 
// --- STYLY OBRAZU (CSS FILTRY) ---
const canvas = document.getElementById("canvas");
document.querySelectorAll(".style-btn").forEach(btn => {
    btn.onclick = () => {
        const style = btn.dataset.style;
        if (style === "none") canvas.style.filter = "none";
        if (style === "grayscale") canvas.style.filter = "grayscale(100%)";
        if (style === "sepia") canvas.style.filter = "sepia(100%)";
        if (style === "invert") canvas.style.filter = "invert(100%)";
        if (style === "contrast") canvas.style.filter = "contrast(200%) saturate(150%)";
    };
});
 
// --- TVŮJ KÓD PRO KRESLENÍ ---
const ctx = canvas.getContext("2d");
let painting = false;
let colorPicker = document.getElementById("colorPicker");
 
// DYNAMICKÉ NAČTENÍ OBRÁZKU Z GALERIE
const img = new Image();
img.crossOrigin = "anonymous";
 
// Tady se podíváme, co nám galerie poslala
const savedArt = localStorage.getItem("currentPainting");
const savedTitle = localStorage.getItem("selectedPaintingTitle");
const savedDesc = localStorage.getItem("selectedPaintingDesc");
 
// Pokud máme cestu z galerie, použijeme ji, jinak default Mona Lisa
img.src = savedArt ? savedArt : "./art/mona_lisa.jpg";
 
// Aktualizace textu v Info panelu, aby tam nebyla jen Mona Lisa
if (savedTitle) {
    const infoHeader = document.querySelector("#panel-info h3");
    const infoText = document.querySelector("#panel-info p");
    if (infoHeader) infoHeader.textContent = savedTitle;
    if (infoText) infoText.textContent = savedDesc;
}
 
img.onload = () => {
    // --- Dynamická velikost canvasu podle obrazu ---
    const ratio = img.naturalWidth / img.naturalHeight; // šířka / výška
    const maxWidth = window.innerWidth * 0.5;  // půlka stránky pro šířku
    const maxHeight = window.innerHeight * 0.5; // půlka pro výšku
    const extraHeightFactor = 1.7; // jak moc chceme vysoké obrazy zvětšit
 
    if (ratio >= 1) {
        // Široký obraz → omezíme podle šířky
        canvas.width = maxWidth;
        canvas.height = canvas.width / ratio;
    } else {
        // Vysoký obraz → zvětšíme podle výšky
        canvas.height = maxHeight * extraHeightFactor;
        canvas.width = canvas.height * ratio;
 
        // Ale aby se nevešel mimo obrazovku, omezení:
        if (canvas.width > window.innerWidth * 0.8) {
            canvas.width = window.innerWidth * 0.8;
            canvas.height = canvas.width / ratio;
        }
    }
 
    // --- Vyčistit canvas před novým obrazem ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
 
    // --- Nakreslit nový obraz ---
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
 
    // --- Načtení starého uloženého obrázku jen pokud je stejné dílo ---
    const saved = localStorage.getItem("editedMonaLisa");
    const savedArt = localStorage.getItem("currentPainting");
    if (saved && savedArt === img.src) {
        const image = new Image();
        image.src = saved;
        image.onload = () => {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
    }
 
    // --- Uložíme aktuální obrázek jako "currentPainting" ---
    localStorage.setItem("currentPainting", img.src);
};
 
function startPosition(e) {
    painting = true;
    draw(e);
}
 
function endPosition() {
    painting = false;
    ctx.beginPath();
}
 
function draw(e) {
    if (!painting) return;
 
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = colorPicker.value;
 
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
 
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}
 
canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mousemove", draw);
 
// --- ULOŽENÍ A VYMAZÁNÍ ---
document.getElementById("clearCanvas").onclick = function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    localStorage.removeItem("editedMonaLisa");
};
 
document.getElementById("saveImage").onclick = function saveImage() {
    const data = canvas.toDataURL("image/png");
    localStorage.setItem("editedMonaLisa", data);
   
    const link = document.createElement("a");
    link.download = "moje-umeni.png";
    link.href = data;
    link.click();
   
    alert("Uloženo do paměti i staženo do PC!");
};
 
function loadImage() {
    const saved = localStorage.getItem("editedMonaLisa");
    if (saved) {
        const image = new Image();
        image.src = saved;
        image.onload = () => {
            ctx.drawImage(image, 0, 0);
        }
    }
}