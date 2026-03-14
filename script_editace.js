// --- LOGIKA MENU A PANELŮ ---
const kurzor = document.getElementById("kurzor");
document.addEventListener("mousemove", (e) => {
    kurzor.style.left = (e.pageX - 20) + "px";
    kurzor.style.top = (e.pageY - 10) + "px";
});

const menu = document.getElementById("sideMenu");
const panels = document.querySelectorAll(".panel");
const canvas = document.getElementById("canvas");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");

function isMobileView() {
    return window.matchMedia("(max-width: 600px)").matches;
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isMobileView()) {
            menu.classList.toggle("is-mobile-open");
        }
    });
}

function showPanel(id) {
    panels.forEach(p => p.classList.add("hidden")); 
    if(id) document.getElementById("panel-" + id).classList.remove("hidden"); 
    if (isMobileView()) {
        menu.classList.remove("is-mobile-open");
    }
}

document.querySelectorAll(".menu-item[data-panel]").forEach(btn => {
    btn.onclick = () => showPanel(btn.dataset.panel);
});

// --- ZAVŘENÍ PANELU KLIKNUTÍM MIMO ---
document.addEventListener("click", (e) => {
    const insidePanel = [...panels].some(p => p.contains(e.target));
    const insideMenu = menu.contains(e.target);
    const clickedToggle = mobileMenuToggle && mobileMenuToggle.contains(e.target);

    if (!insidePanel && !insideMenu) {
        panels.forEach(p => p.classList.add("hidden"));
    }

    if (isMobileView() && !insideMenu && !clickedToggle) {
        menu.classList.remove("is-mobile-open");
    }
});

// --- STYLY OBRAZU ---
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

// --- DYNAMICKÉ NAČÍTÁNÍ INFO PANELU ---
const currentImgUrl = localStorage.getItem("currentPainting") || "./art/mona_lisa.jpg";
const savedTitle = localStorage.getItem("selectedPaintingTitle");
const savedDesc = localStorage.getItem("selectedPaintingDesc");

if (savedTitle || savedDesc) {
    const titleElement = document.querySelector("#panel-info h3");
    const descElement = document.querySelector("#panel-info p");
    
    if (titleElement) titleElement.textContent = savedTitle || "Neznámý obraz";
    if (descElement) descElement.textContent = savedDesc || "Popis není k dispozici.";
}

// ==========================================
// --- KRESLENÍ S NEVIDITELNOU VRSTVOU ---
// ==========================================
const ctx = canvas.getContext("2d");

// Vytvoříme si v paměti "fólii" (neviditelné plátno) pro naše kreslení
const drawingCanvas = document.createElement("canvas");
const dctx = drawingCanvas.getContext("2d");

let painting = false;
let currentTool = "pencil";
let history = [];
let redoList = [];

const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");

const img = new Image();
img.crossOrigin = "anonymous"; 
img.src = currentImgUrl;

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

    // Fólie musí mít stejné rozměry jako plátno
    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;

    loadSpecificEdits(); // Načteme historii tahů
    updateScreen();      // Poskládáme obraz a kresbu dohromady
};

// Funkce, která všechno spojí a vykreslí na obrazovku
function updateScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Podklad
    ctx.drawImage(drawingCanvas, 0, 0); // Kresba (s průhlednostmi z gumy)
}

// --- FUNKCE KRESLENÍ NA FÓLII ---
function startPosition(e) {
    saveToHistory();
    painting = true;
    draw(e);
}

function endPosition() {
    painting = false;
    dctx.beginPath(); // Důležité: Začínáme novou cestu na fólii
    saveCurrentState();
}

function draw(e) {
    if (!painting) return;

    // VŠE KRESLÍME JEN NA FÓLII (dctx), NE NA HLAVNÍ PLÁTNO
    dctx.lineWidth = brushSizeInput.value;
    dctx.lineCap = "round";
    dctx.lineJoin = "round";

    if (currentTool === "eraser") {
        dctx.globalCompositeOperation = "destination-out"; // Nyní funguje správně!
    } else {
        dctx.globalCompositeOperation = "source-over";
        dctx.strokeStyle = colorPicker.value;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    dctx.lineTo(x, y);
    dctx.stroke();
    dctx.beginPath();
    dctx.moveTo(x, y);

    // Po každém tahu spojíme fólii s fotkou, abys to viděl
    updateScreen(); 
}

canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mousemove", draw);
// --- PODPORA PRO MOBIL (TOUCH) ---
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startPosition(e.touches[0]);
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    endPosition();
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    draw(e.touches[0]);
});

// --- HISTORIE ---
function saveToHistory() {
    // Do historie ukládáme jen čistou fólii (bez Mony Lisy) - šetří to obří kusy paměti!
    history.push(drawingCanvas.toDataURL());
    if (history.length > 30) history.shift();
    redoList = [];
}

function undo() {
    if (history.length > 0) {
        redoList.push(drawingCanvas.toDataURL());
        renderState(history.pop());
    }
}

function redo() {
    if (redoList.length > 0) {
        history.push(drawingCanvas.toDataURL());
        renderState(redoList.pop());
    }
}

function renderState(stateUrl) {
    const imgState = new Image();
    imgState.src = stateUrl;
    imgState.onload = () => {
        dctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        dctx.drawImage(imgState, 0, 0);
        updateScreen();
        saveCurrentState();
    };
}

// --- OVLÁDÁNÍ ---
document.getElementById("toolPencil").onclick = () => currentTool = "pencil";
document.getElementById("toolEraser").onclick = () => currentTool = "eraser";
document.getElementById("undoBtn").onclick = undo;
document.getElementById("redoBtn").onclick = redo;

function saveCurrentState() {
    localStorage.setItem("edits_" + currentImgUrl, drawingCanvas.toDataURL("image/png"));
}

function loadSpecificEdits() {
    const saved = localStorage.getItem("edits_" + currentImgUrl);
    if (saved) {
        const tempImg = new Image();
        tempImg.src = saved;
        tempImg.onload = () => {
            dctx.drawImage(tempImg, 0, 0); // Vykreslíme to na fólii
            updateScreen();
        };
    }
}

document.getElementById("clearCanvas").onclick = () => {
    if(!confirm("Opravdu smazat všechny úpravy?")) return;
    dctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); 
    updateScreen(); 
    localStorage.removeItem("edits_" + currentImgUrl);
    history = []; redoList = [];
};

document.getElementById("saveImage").onclick = () => {
    // Tady musíme vzít HLAVNÍ plátno, protože obsahuje jak obraz, tak malůvky
    const data = canvas.toDataURL("image/png");
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
        store.add({ imageData: data, title: savedTitle || "Dílo", date: new Date().toLocaleString("cs-CZ") });
        transaction.oncomplete = () => {
            const link = document.createElement("a");
            link.download = "moje-umeni.png"; link.href = data; link.click();
            alert("Nádherné dílo! Uloženo do Tvé galerie. ✨");
        };
    };
};
// --- AUTOMATICKÉ OTEVŘENÍ PANELU NA MOBILU ---
function openPanelOnMobile() {
    if (window.innerWidth < 900) {
        const panelDraw = document.getElementById("panel-draw");
        if (panelDraw) panelDraw.classList.remove("hidden");
    }
}

window.addEventListener("load", openPanelOnMobile);
window.addEventListener("resize", openPanelOnMobile);