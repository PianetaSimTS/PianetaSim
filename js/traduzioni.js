// Gestione del popup Help Sim
document.getElementById("desc-mod-btn").addEventListener("click", function(event) {
    event.preventDefault();
    document.getElementById("popup").style.display = "block";
});

document.getElementById("close-btn").addEventListener("click", function() {
    document.getElementById("popup").style.display = "none";
});

document.getElementById("download-btn").addEventListener("click", function() {
    const link = document.createElement("a");
    link.href = "https://github.com/PianetaSimTS/HelpSim/releases/download/HelpSim/HelpSim.exe";
    link.download = "HelpSim.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.getElementById("popup").style.display = "none";
});

// Caricamento dei dati dal JSON
function loadModsFromJson() {    
    fetch('https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/traduzioni.json')
    .then(response => response.json())
    .then(mods => {
        const pageId = "traduzioni";
        const favorites = JSON.parse(localStorage.getItem("favorites_" + pageId)) || [];
        const table = document.getElementById("modTable").getElementsByTagName("tbody")[0];
        table.innerHTML = '';
        const lang = localStorage.getItem("language") || "it";
        
        mods.forEach(mod => {
            const isFavorite = favorites.includes(mod.Title);
            const newRow = table.insertRow();
            const modLink = mod.Link || '#';
            sessionStorage.setItem(mod.Creator, modLink);

            newRow.innerHTML = `
                <td>
                    <span class="star-container">
                        <span class="star ${isFavorite ? 'favorite' : ''}" onclick="toggleFavorite('${mod.Title}')">&#9733;</span>
                    </span>
                </td>
                <td>${mod.Creator || ''}</td>
                <td class="mod-name">${mod.Title || ''}</td>
                <td>${mod.ReleaseVersion || ''}</td>
                <td>${mod.CurrentVersion || ''}</td>
                <td>
                    <span class="status ${(mod.Status || 'Sconosciuta').toLowerCase().replace(' ', '-')}">
                        ${lang === "en" ? (translations[mod.Status] || mod.Status) : mod.Status}
                    </span>
                </td>
                <td>
                    <span class="traduzione">
                        <a href="${mod.Link || '#'}" target="_blank">${mod.Translator || ''}</a>
                    </span>
                </td>
            `;
        });
        checkModUpdates(mods);
        filterTable();
    })
    .catch(error => console.error('Errore nel caricare il JSON:', error));
}

// Controllo aggiornamenti delle traduzioni
function checkModUpdates(mods) {
    let favorites = JSON.parse(localStorage.getItem("favorites_traduzioni")) || [];
    let savedMods = JSON.parse(localStorage.getItem("savedTraduzioni")) || {};
    let updatedMods = [];

    mods.forEach(mod => {
        if (favorites.includes(mod.Title)) {
            let prevData = savedMods[mod.Title] || {};
            let dataUltimaModifica = mod.CurrentVersion || mod.ReleaseVersion || "Data non disponibile";

            if (!prevData.Status || !prevData.DataUltimaModifica || 
                prevData.Status !== mod.Status || prevData.DataUltimaModifica !== dataUltimaModifica) {
                updatedMods.push(mod);
            }

            savedMods[mod.Title] = {
                Status: mod.Status || 'sconosciuto',
                DataUltimaModifica: dataUltimaModifica
            };
        }
    });

    localStorage.setItem("savedTraduzioni", JSON.stringify(savedMods));
    const lang = localStorage.getItem("language") || "it";
    const notificationTexts = {
        it: "Le seguenti traduzioni preferite sono state modificate:\n",
        en: "The following favorite translations have been changed:\n"
    };

    const statusLabel = lang === "it" ? "Stato" : "Status";

    if (updatedMods.length > 0) {
        let message = notificationTexts[lang] + 
                      updatedMods.map(mod => `${mod.Title} - ${statusLabel}: ${mod.CurrentVersion || mod.ReleaseVersion || 'Data non disponibile'}`).join("\n");
        alert(message);
    }
}

// Ordinamento tabella
let lastSortedColumn = -1;
let lastSortDirection = 'asc';

function sortTable(columnIndex) {
    const table = document.getElementById("modTable");
    const rows = Array.from(table.rows).slice(1);
    const arrow = document.getElementById(`arrow-${columnIndex}`);

    if (lastSortedColumn === columnIndex) {
        lastSortDirection = (lastSortDirection === 'asc') ? 'desc' : 'asc';
    } else {
        lastSortDirection = 'asc';
    }

    const compare = (a, b) => {
        let valA = a.cells[columnIndex].textContent.trim().toLowerCase();
        let valB = b.cells[columnIndex].textContent.trim().toLowerCase();

        if (valA < valB) return lastSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return lastSortDirection === 'asc' ? 1 : -1;
        return 0;
    };

    rows.sort(compare);
    rows.forEach(row => table.appendChild(row));

    document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.className = 'sort-arrow');
    arrow.classList.add(lastSortDirection);
    lastSortedColumn = columnIndex;
}

// Traduzioni
const translations = {
    "Compatibile": "Compatible",
    "Rotta": "Broken",
    "Aggiornata": "Updated",
    "Sconosciuta": "Unknown",
    "Nuova": "New",
    "Da Aggiornare": "To be updated",
    "Obsoleta": "Obsolete",
    "In Lavorazione": "To Do",
    "To Do": "In Lavorazione",
    "Compatible": "Compatibile",
    "Broken": "Rotta",
    "Updated": "Aggiornata",
    "Unknown": "Sconosciuta",
    "New": "Nuova",
    "To be updated": "Da Aggiornare",
    "Obsolete": "Obsoleta"
};

// Filtro tabella
function filterTable() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const isEnglish = document.querySelector(".en-label").style.display !== "none";
    
    const selectedStatuses = Array.from(document.querySelectorAll('#filter-status-dropdown input:checked'))
                                    .map(input => {
                                        let value = input.value;
                                        return isEnglish ? translations[value] : value; 
                                    }).map(v => v.toLowerCase());

    const filterFavorites = document.getElementById("filter-favorites").value.toLowerCase();
    const table = document.getElementById("modTable");
    const rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const author = row.cells[1]?.textContent.toLowerCase() || "";
        const modName = row.cells[2]?.textContent.toLowerCase() || "";
        let status = row.querySelector(".status").textContent.trim();
        let translatedStatus = isEnglish ? translations[status] || status : status;
        translatedStatus = translatedStatus.toLowerCase();
        const isFavorite = row.querySelector(".star").classList.contains("favorite");
        const matchesSearch = author.includes(searchValue) || modName.includes(searchValue);
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(translatedStatus);
        const matchesFavorites = !filterFavorites || (filterFavorites === 'true' ? isFavorite : !isFavorite);
        row.style.display = (matchesSearch && matchesStatus && matchesFavorites) ? "" : "none";
    }
}

// Gestione preferiti
function toggleFavorite(title) {
    const lang = localStorage.getItem("language") || "it";
    const cleanedTitle = title.replace("'", "");
    const pageId = "traduzioni";
    let favorites = JSON.parse(localStorage.getItem("favorites_" + pageId)) || [];
    
    if (favorites.includes(cleanedTitle)) {
        favorites = favorites.filter(favorite => favorite !== cleanedTitle);
        alert(title + (lang === "en" ? " has been removed from favorites." : " è stata rimossa dai preferiti."));
    } else {
        favorites.push(cleanedTitle);
        alert(title + (lang === "en" ? " has been added to favorites!" : " è stata aggiunta ai preferiti!"));
    }
    
    localStorage.setItem("favorites_" + pageId, JSON.stringify(favorites));
    loadModsFromJson();
}

// Gestione tema
function applyTheme(theme) {
    const root = document.documentElement;
    const themeSwitch = document.getElementById("themeSwitch");
    
    if (theme === "light") {
        root.style.setProperty("--navbarbackground", "#ffffff");
        root.style.setProperty("--navbarcolor", "#000000");
        root.style.setProperty("--formcontainerbackground", "#ffffff");
        root.style.setProperty("--formcontainercolor", "black");
        root.style.setProperty("--h1backgroundcolor", "#ffffff");
        root.style.setProperty("--h1color", "black");
        root.style.setProperty("--thchildcolor", "#f2f2f2");
        root.style.setProperty("--tdcolor", "#f9f9f9");
        root.style.setProperty("--thcolor", "#000000");
        root.style.setProperty("--bodybackground", "#ffffff");
        root.style.setProperty("--sconosciutavar", "#545454");
        root.style.setProperty("--thtdcolor", "black");
        root.style.setProperty("--tdacolor", "blue");
        root.style.setProperty("--tdahover", "#551A8B");
        root.style.setProperty("--tdactive", "#000080");    
        root.style.setProperty("--text-color", "#000");
        themeSwitch.textContent = "🌞";
    } else {
        root.style.setProperty("--navbarbackground", "#343a40");
        root.style.setProperty("--navbarcolor", "#fff");
        root.style.setProperty("--formcontainerbackground", "#343a40");
        root.style.setProperty("--formcontainercolor", "#fff");
        root.style.setProperty("--h1backgroundcolor", "#343a40");
        root.style.setProperty("--h1color", "white");
        root.style.setProperty("--thchildcolor", "#666666");
        root.style.setProperty("--tdcolor", "#555555");
        root.style.setProperty("--thcolor", "white");
        root.style.setProperty("--bodybackground", "#343a40");
        root.style.setProperty("--sconosciutavar", "#FFFBB9");
        root.style.setProperty("--thtdcolor", "white");
        root.style.setProperty("--tdacolor", "#B57EDC");
        root.style.setProperty("--tdahover", "#FFB6C1");
        root.style.setProperty("--tdactive", "#8E44AD");
        root.style.setProperty("--text-color", "#fff");
        themeSwitch.textContent = "🌙";
    }
}

// Gestione lingua
const languageSwitch = document.getElementById("language-switch");
const languageLabel = document.getElementById("language-label");
const texts = {
    it: {
        helpSimTitle: "🚀 HELP SIM",
        helpSimDesc: "Stanco di installare mod e traduzioni a mano? Help Sim è qui per salvarti! Con pochi click, potrai aggiungere le tue mod preferite, tenere tutto sotto controllo e persino dare una bella ripulita ai file cache di The Sims 4! Che tu voglia ampliare il tuo gioco con nuove mod o semplicemente tenere tutto in ordine, sei nel posto giusto.",
        relax: "Ora rilassati, personalizza il tuo gioco e lascia che <strong>Help Sim</strong> faccia il resto! 🎮✨",
        precautions: "⚠️ PICCOLE ATTENZIONI PRIMA DELLO SCARICO ⚠️",
        antivirus: "★ Se l'antivirus blocca il programma, clicca su <strong>\"Esegui comunque\"</strong>.<br>Il programma è sicuro! In quanto creato interamente da noi.",
        guide: "★ Prima dell'uso, <strong>leggi la guida</strong> disponibile nella home del programma.",
        zipSupport: "★ Supporta solo i file delle mod e delle traduzioni in <strong>formato ZIP</strong>.",
        noPackage: "★ <strong>Non supporta</strong> i file singoli <em>.package</em> (CC e mod non zip).",
        noExternal: "★ <strong>Non funziona</strong> con la cartella di The Sims in unità esterne (HDD, SSD, USB, ecc.).",
        download: "📥 Scarica",
        close: "❌ Chiudi",
        pageTitle: "Tabella - Traduzioni",
        modLink: "MOD",
        mod18Link: "MOD +18",
        animazioniww18Link: "ANIMAZIONI WICKEDWHIMS +18",
        traduzioniLink: "TRADUZIONI",
        programmiLink: "PROGRAMMI",
        helpSimLink: "HELP SIM",
        searchPlaceholder: "Cerca...",
        filterStatusLabel: "Stato:",
        filterFavoritesLabel: "Preferite:",
        favoritesAll: "Tutte",
        favoritesYes: "Preferite",
        favoritesNo: "Non Preferite",
        tableHeaders: ["PREFERITE", "AUTORE MOD", "NOME MOD", "DATA O VERSIONE MOD", "DATA O VERSIONE TRADUZIONE", "STATO TRADUZIONE", "TRADUZIONE"]
    },
    en: {
        helpSimTitle: "🚀 HELP SIM",
        helpSimDesc: "Tired of installing mods and translations manually? Help Sim is here to save you! With just a few clicks, you can add your favorite mods, keep everything under control and even give The Sims 4 cache files a good clean! Whether you want to expand your game with new mods or simply keep everything in order, you are in the right place.",
        relax: "Now relax, customize your game and let <strong>Help Sim</strong> do the rest! 🎮✨",
        precautions: "⚠️ SMALL PRECAUTIONS BEFORE DOWNLOADING ⚠️",
        antivirus: "★ If the antivirus blocks the program, click on <strong>\"Run anyway\"</strong>.<br>The program is safe! It was entirely created by us.",
        guide: "★ Before using it, <strong>read the guide</strong> available on the program's home page.",
        zipSupport: "★ Supports only mod and translation files in <strong>ZIP format</strong>.",
        noPackage: "★ <strong>Does not support</strong> single <em>.package</em> files (CC and non-zipped mods).",
        noExternal: "★ <strong>Does not work</strong> with The Sims folder on external drives (HDD, SSD, USB, etc.).",    
        download: "📥 Download",
        close: "❌ Close",
        pageTitle: "Table - Italian Translations",
        modLink: "MOD",
        mod18Link: "MOD +18",
        animazioniww18Link: "ANIMATIONS WICKEDWHIMS +18",
        traduzioniLink: "ITALIAN TRANSLATIONS",
        programmiLink: "PROGRAMS",
        helpSimLink: "HELP SIM",
        searchPlaceholder: "Search...",
        filterStatusLabel: "Status:",
        filterFavoritesLabel: "Favorites:",
        favoritesAll: "All",
        favoritesYes: "Favorites",
        favoritesNo: "No Favorites",
        tableHeaders: ["FAVORITES", "MOD AUTHOR", "MOD NAME", "MOD DATE OR VERSION", "ITALIAN TRANSLATION DATE OR VERSION", "ITALIAN TRANSLATION STATUS", "ITALIAN TRANSLATION"]
    }
};

// Cambio lingua
function toggleLanguage() {
    const isEnglish = languageSwitch.checked;
    const lang = isEnglish ? "en" : "it";
    const currentTexts = texts[lang];
    
    languageLabel.textContent = isEnglish ? "English" : "Italiano";
    localStorage.setItem("language", lang);

    // Aggiornamento dei testi
    document.querySelector("#popup h2").textContent = currentTexts.helpSimTitle;
    document.querySelector("#popup p").innerHTML = currentTexts.helpSimDesc;
    document.querySelector("#popup p:nth-of-type(2)").innerHTML = currentTexts.relax;
    document.querySelector("#popup h3").textContent = currentTexts.precautions;
    
    const precautionsList = document.querySelector("#popup ul");
    precautionsList.innerHTML = `
        <li>${currentTexts.antivirus}</li>
        <li>${currentTexts.guide}</li>
        <li>${currentTexts.zipSupport}</li>
        <li>${currentTexts.noPackage}</li>
        <li>${currentTexts.noExternal}</li>
    `;
    
    document.getElementById("download-btn").textContent = currentTexts.download;
    document.getElementById("close-btn").textContent = currentTexts.close;
    document.getElementById("page-title").textContent = currentTexts.pageTitle;
    document.getElementById("mod-link").textContent = currentTexts.modLink;
    document.getElementById("mod18-link").textContent = currentTexts.mod18Link;
    document.getElementById("animazioniww18-link").textContent = currentTexts.animazioniww18Link;
    document.getElementById("traduzioni-link").textContent = currentTexts.traduzioniLink;
    document.getElementById("programmi-link").textContent = currentTexts.programmiLink;
    document.getElementById("desc-mod-btn").textContent = currentTexts.helpSimLink;
    document.querySelector("#search").placeholder = currentTexts.searchPlaceholder;
    document.getElementById("filter-status-label").textContent = currentTexts.filterStatusLabel;
    document.getElementById("filter-favorites-label").textContent = currentTexts.filterFavoritesLabel;
    
    // Aggiorna intestazioni tabella
    const headers = document.querySelectorAll("#modTable th");
    headers.forEach((header, index) => {
        header.textContent = currentTexts.tableHeaders[index];
        const arrow = document.createElement("span");
        arrow.className = "sort-arrow";
        arrow.id = `arrow-${index}`;
        header.appendChild(arrow);
    });
    
    // Aggiorna dropdown stato
    const italianLabels = document.querySelectorAll('.it-label');
    const englishLabels = document.querySelectorAll('.en-label');
    italianLabels.forEach(label => label.style.display = isEnglish ? 'none' : 'block');
    englishLabels.forEach(label => label.style.display = isEnglish ? 'block' : 'none');
    
    // Aggiorna dropdown preferiti
    const filterFavorites = document.getElementById('filter-favorites');
    filterFavorites.innerHTML = `
        <option value="">${currentTexts.favoritesAll}</option>
        <option value="true">${currentTexts.favoritesYes}</option>
        <option value="false">${currentTexts.favoritesNo}</option>
    `;
    
    // Reset filtri
    document.getElementById("search").value = "";
    filterFavorites.selectedIndex = 0;
    filterTable();
    setTimeout(loadModsFromJson, 100);
}

// Impostazione lingua iniziale
function setInitialLanguage() {
    const savedLanguage = localStorage.getItem("language") || "it";
    languageSwitch.checked = savedLanguage === "en";
    toggleLanguage();
}

// Toggle dropdown
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    const button = dropdown.previousElementSibling;

    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        setTimeout(function() {
            dropdown.style.opacity = 1;
        }, 10);
        button.innerHTML = '▲';
    } else {
        dropdown.style.opacity = 0;
        setTimeout(function() {
            dropdown.style.display = 'none';
        }, 300);
        button.innerHTML = '▼';
    }
}

// Toggle tema
function toggleTheme() {
    const currentTheme = localStorage.getItem("theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
}

// Scroll to top
window.onscroll = function() {
    const scrollToTopBtn = document.getElementById("scrollToTop");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        scrollToTopBtn.style.display = "block";
    } else {
        scrollToTopBtn.style.display = "none";
    }
};

// Inizializzazione
window.onload = function() {
    // Event listeners
    languageSwitch.addEventListener("change", toggleLanguage);
    document.getElementById("scrollToTop").addEventListener("click", function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
    
    // Chiudi dropdown se si clicca fuori
    document.addEventListener("click", function(event) {
        const dropdowns = document.querySelectorAll("#filter-status-dropdown");
        dropdowns.forEach(dropdown => {
            if (!event.target.closest("#filter-status-dropdown") && !event.target.closest("#filter-status-label")) {
                dropdown.style.display = "none";
                dropdown.style.opacity = "0";
            }
        });
    });
    
    // Gestione beforeunload
    window.addEventListener('beforeunload', () => {
        Object.keys(sessionStorage)
            .filter(key => key !== 'favorites')
            .forEach(key => sessionStorage.removeItem(key)); 
    });
    
    // Caricamento iniziale
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);
    setInitialLanguage();
    loadModsFromJson();
};