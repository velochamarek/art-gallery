        // Tento řádek zajistí, že se při každém načtení/refreshi smaže uložená verze
localStorage.removeItem("editedMonaLisa");

// Pokud bys chtěl navigaci řešit přes JS (nepovinné, pokud máš v HTML <a>)
const backBtn = document.querySelector(".back-btn");
if (backBtn) {
    backBtn.onclick = () => {
        window.location.href = "index.html"; // Sem dej název svého hlavního souboru
    };
}
        
        // --- LOGIKA MENU A PANELŮ ---
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
            panels.forEach(p => p.classList.add("hidden")); // Skryje všechny
            if(id) document.getElementById("panel-" + id).classList.remove("hidden"); // Zobrazí vybraný
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

        const img = new Image();
        // Přidán crossorigin, aby fungovalo ukládání obrázku staženého z internetu
        img.crossOrigin = "anonymous"; 
        img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/600px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"; 

        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            loadImage();
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

            // Oprava pro přesné zaměření kurzoru
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
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Smaže vše
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Vykreslí čistou Monu Lisu
            localStorage.removeItem("editedMonaLisa"); // Smaže zálohu z paměti
        };

        document.getElementById("saveImage").onclick = function saveImage() {
            const data = canvas.toDataURL("image/png");
            localStorage.setItem("editedMonaLisa", data);
            
            // Navíc umožníme uživateli si obrázek stáhnout do PC!
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