// --- LOGIKA MENU A PANELŮ ---
const kurzor = document.getElementById("kurzor");
document.addEventListener("mousemove", (e) => {
    kurzor.style.left = (e.pageX - 20) + "px";
    kurzor.style.top = (e.pageY - 10) + "px";
});

const menu = document.getElementById("sideMenu");

const panels = document.querySelectorAll(".panel");
function showPanel(id) {
    panels.forEach(p => p.classList.add("hidden")); 
    if(id) document.getElementById("panel-" + id).classList.remove("hidden"); 
}

document.querySelectorAll(".menu-item[data-panel]").forEach(btn => {
    btn.onclick = () => showPanel(btn.dataset.panel);
});

// --- STYLY OBRAZU ---
const canvas = document.getElementById("canvas");
document.querySelectorAll(".style-btn").forEach(btn => {
    btn.onclick = () => {
        const style = btn.dataset.style;
        canvas.style.filter = (style === "none") ? "none" : 
                             (style === "grayscale") ? "grayscale(100%)" :
                             (style === "sepia") ? "sepia(100%)" :
                             (style === "invert") ? "invert(100%)" :
                             "contrast(200%) saturate(150%)";
    };
});
let menuTimeout;

canvas.addEventListener("mouseenter", () => {
    clearTimeout(menuTimeout);
    menu.classList.remove("open");
    panels.forEach(p => p.classList.add("hidden"));
});

canvas.addEventListener("mouseleave", () => {
    menuTimeout = setTimeout(() => {
        menu.classList.add("open");
    }, 300);
});
// --- DYNAMICKÉ NAČÍTÁNÍ ---
const ctx = canvas.getContext("2d");
let painting = false;
let colorPicker = document.getElementById("colorPicker");

const img = new Image();
img.crossOrigin = "anonymous"; 

const currentImgUrl = localStorage.getItem("currentPainting") || "./art/mona_lisa.jpg";
const savedTitle = localStorage.getItem("selectedPaintingTitle");
const savedDesc = localStorage.getItem("selectedPaintingDesc");

img.src = currentImgUrl;

if (savedTitle) {
    document.querySelector("#panel-info h3").textContent = savedTitle;
    document.querySelector("#panel-info p").textContent = savedDesc;
}

img.onload = () => {
    const ratio = img.naturalWidth / img.naturalHeight;
    const maxWidth = window.innerWidth * 0.6;
    const maxHeight = window.innerHeight * 0.8; 

    if (maxWidth / maxHeight > ratio) {
        canvas.height = maxHeight;
        canvas.width = canvas.height * ratio;
    } else {
        canvas.width = maxWidth;
        canvas.height = canvas.width / ratio;
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    loadSpecificEdits(); 
};

// --- KRESLENÍ ---
function startPosition(e) { painting = true; draw(e); }
function endPosition() { painting = false; ctx.beginPath(); saveCurrentState(); }

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

// --- PAMĚŤ A UKLÁDÁNÍ ---
function saveCurrentState() {
    const data = canvas.toDataURL("image/png");
    localStorage.setItem("edits_" + currentImgUrl, data);
}

function loadSpecificEdits() {
    const saved = localStorage.getItem("edits_" + currentImgUrl);
    if (saved) {
        const tempImg = new Image();
        tempImg.src = saved;
        tempImg.onload = () => ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
    }
}

document.getElementById("clearCanvas").onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
    localStorage.removeItem("edits_" + currentImgUrl);
    localStorage.removeItem("editedMonaLisa"); 
};

document.getElementById("saveImage").onclick = () => {
    const data = canvas.toDataURL("image/png");
    const title = savedTitle || "Moje dílo";
    const date = new Date().toLocaleString("cs-CZ");

    const request = indexedDB.open("MuseumGalleryDB", 2);

    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("savedArtworks")) {
            db.createObjectStore("savedArtworks", { keyPath: "id", autoIncrement: true });
        }
    };

    request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction("savedArtworks", "readwrite");
        const store = transaction.objectStore("savedArtworks");
        store.add({ imageData: data, title: title, date: date });
        
        transaction.oncomplete = () => {
            const link = document.createElement("a");
            link.download = "moje-umeni.png";
            link.href = data;
            link.click();
            alert("Uloženo do galerie i do PC! ✨");
        };
    };
    request.onerror = () => alert("Chyba při otevírání databáze.");
};