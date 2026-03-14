document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("gallery-grid");

    // Otevřeme stejnou databázi, do které jsme ukládali v editoru
    const request = indexedDB.open("MuseumGalleryDB", 1);

    request.onsuccess = function(e) {
        const db = e.target.result;
        
        // Pokud databáze existuje, ale chybí v ní tabulka (např. uživatel sem přišel dřív, než něco uložil)
        if (!db.objectStoreNames.contains("savedArtworks")) {
            grid.innerHTML = "<p class='empty-msg'>Zatím tu nic není. Běž do muzea a něco nakresli!</p>";
            return;
        }

        const transaction = db.transaction("savedArtworks", "readonly");
        const store = transaction.objectStore("savedArtworks");
        const getAllRequest = store.getAll(); // Vytáhneme všechno

        getAllRequest.onsuccess = function() {
            const artworks = getAllRequest.result;

            if (artworks.length === 0) {
                grid.innerHTML = "<p class='empty-msg'>Zatím tu nic není. Běž do muzea a něco nakresli!</p>";
                return;
            }

            // Projdeme všechny uložené obrazy od nejnovějšího po nejstarší
            artworks.reverse().forEach(art => {
                const card = document.createElement("div");
                card.className = "art-card";
                
                // Poskládáme HTML pro jeden obraz
                card.innerHTML = `
                    <img src="${art.imageData}" alt="${art.title}">
                    <h3>${art.title}</h3>
                    <p>${art.date}</p>
                    <button class="delete-btn" onclick="deleteArtwork(${art.id})">Smazat obraz</button>
                `;
                
                grid.appendChild(card);
            });
        };
    };

    request.onerror = function() {
        grid.innerHTML = "<p class='empty-msg'>Nepodařilo se načíst databázi.</p>";
    };
});

// Funkce pro smazání obrazu
function deleteArtwork(id) {
    if(!confirm("Opravdu chceš tento obraz smazat a vyhodit z galerie?")) return;

    const request = indexedDB.open("MuseumGalleryDB", 1);
    request.onsuccess = function(e) {
        const db = e.target.result;
        const transaction = db.transaction("savedArtworks", "readwrite");
        const store = transaction.objectStore("savedArtworks");
        
        store.delete(id); // Smaže podle ID

        transaction.oncomplete = function() {
            // Po smazání jen obnovíme stránku, aby obraz zmizel
            window.location.reload();
        };
    };
}