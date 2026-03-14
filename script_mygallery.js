document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return; // Pojistka, pokud bys to omylem spustil jinde

    const request = indexedDB.open("MuseumGalleryDB", 2);

    request.onsuccess = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("savedArtworks")) {
            grid.innerHTML = "<p class='empty-msg'>Zatím tu nic není. Běž do muzea a něco nakresli!</p>";
            return;
        }

        const transaction = db.transaction("savedArtworks", "readonly");
        const store = transaction.objectStore("savedArtworks");
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = function() {
            const artworks = getAllRequest.result;
            if (!artworks || artworks.length === 0) {
                grid.innerHTML = "<p class='empty-msg'>Zatím tu nic není. Běž do muzea a něco nakresli!</p>";
                return;
            }

            grid.innerHTML = ""; 
            artworks.reverse().forEach(art => {
                const card = document.createElement("div");
                card.className = "art-card";
                card.innerHTML = `
                    <img src="${art.imageData}" alt="${art.title}">
                    <div class="art-info">
                        <h3>${art.title}</h3>
                        <p>${art.date}</p>
                        <button class="delete-btn" onclick="deleteArtwork(${art.id})">Smazat obraz</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        };
    };
});
const kurzor = document.getElementById("kurzorr");
document.addEventListener("mousemove", (e) => {
    kurzor.style.left = (e.clientX-15) + "px";
    kurzor.style.top  = (e.clientY-20) + "px";
});
function deleteArtwork(id) {
    if(!confirm("Opravdu chceš tento obraz vyřadit ze své sbírky?")) return;
    const request = indexedDB.open("MuseumGalleryDB", 2);
    request.onsuccess = function(e) {
        const db = e.target.result;
        const transaction = db.transaction("savedArtworks", "readwrite");
        const store = transaction.objectStore("savedArtworks");
        store.delete(id);
        transaction.oncomplete = () => window.location.reload();
    };
}