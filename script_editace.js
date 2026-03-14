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

document.getElementById("closeMenu").onclick = () => {
    menu.classList.remove("open");
    panels.forEach(p => p.classList.add("hidden"));
};

// --- AUTO-SCHOVÁVÁNÍ MENU ---
let menuTimeout;
const canvas = document.getElementById("canvas");
canvas.addEventListener("mouseenter", () => {
    clearTimeout(menuTimeout);
    menu.classList.remove("open");
    panels.forEach(p => p.classList.add("hidden"));
});
canvas.addEventListener("mouseleave", () => {
    menuTimeout = setTimeout(() => { menu.classList.add("open"); }, 300);
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

// --- DYNAMICKÉ NAČÍTÁNÍ A KRESLENÍ ---
const ctx = canvas.getContext("2d");
let painting = false;
let currentTool = "pencil";
let history = [];
let redoList = [];

const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");

const img = new Image();
img.crossOrigin = "anonymous"; 
const currentImgUrl = localStorage.getItem("currentPainting") || "./art/mona_lisa.jpg";
const savedTitle = localStorage.getItem("selectedPaintingTitle");
const savedDesc = localStorage.getItem("selectedPaintingDesc");

img.src = currentImgUrl;

if (savedTitle || savedDesc) {
    const titleElement = document.querySelector("#panel-info h3");
    const descElement = document.querySelector("#panel-info p");
    
    if (titleElement) titleElement.textContent = savedTitle || "Neznámý obraz";
    if (descElement) descElement.textContent = savedDesc || "Popis není k dispozici.";
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

// --- FUNKCE KRESLENÍ ---
function startPosition(e) {
    saveToHistory();
    painting = true;
    draw(e);
}
function endPosition() {
    painting = false;
    ctx.beginPath();
    saveCurrentState();
}
function draw(e) {
    if (!painting) return;
    ctx.lineWidth = brushSizeInput.value;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = colorPicker.value;
    }

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

// --- HISTORIE ---
function saveToHistory() {
    history.push(canvas.toDataURL());
    if (history.length > 30) history.shift();
    redoList = [];
}
function undo() {
    if (history.length > 0) {
        redoList.push(canvas.toDataURL());
        renderState(history.pop());
    }
}
function redo() {
    if (redoList.length > 0) {
        history.push(canvas.toDataURL());
        renderState(redoList.pop());
    }
}
function renderState(stateUrl) {
    const imgState = new Image();
    imgState.src = stateUrl;
    imgState.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgState, 0, 0);
        saveCurrentState();
    };
}

// --- OVLÁDÁNÍ ---
document.getElementById("toolPencil").onclick = () => currentTool = "pencil";
document.getElementById("toolEraser").onclick = () => currentTool = "eraser";
document.getElementById("undoBtn").onclick = undo;
document.getElementById("redoBtn").onclick = redo;

function saveCurrentState() {
    localStorage.setItem("edits_" + currentImgUrl, canvas.toDataURL("image/png"));
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
    if(!confirm("Smazat vše?")) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
    localStorage.removeItem("edits_" + currentImgUrl);
    history = []; redoList = [];
};

document.getElementById("saveImage").onclick = () => {
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
            alert("Uloženo! ✨");
        };
    };
};