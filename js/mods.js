let lastSortedColumn = -1;
let lastSortDirection = 'asc';

// Funzione per ottenere la traduzione della categoria in base alla lingua selezionata
function translateCategory(category, lang) {
  if (lang === "en") {
    return categoryTranslation[category] || category;
  } else {
    return Object.keys(categoryTranslation).find(key => categoryTranslation[key] === category) || category;
  }
}
function separateModsAndDlc(dependencyString) {
  if (!dependencyString) {
    return { mods: '', dlc: '' };
  }
  
  const mods = [];
  const dlc = [];
  
  // Separa la stringa usando " - " come delimitatore
  const parts = dependencyString.split(' - ');
  
  parts.forEach(part => {
    if (part.startsWith('MOD:')) {
      // Rimuove "MOD:" e aggiunge alla lista mods
      mods.push(part.replace('MOD:', '').trim());
    } else if (part.startsWith('DLC:')) {
      // Rimuove "DLC:" e aggiunge alla lista dlc
      dlc.push(part.replace('DLC:', '').trim());
    }
  });
  
  return {
    mods: mods.join(', '),
    dlc: dlc.join(', ')
  };
}
// Funzione per aggiornare il dropdown delle categorie con la lingua selezionata
function updateCategoryDropdown(mods) {
  const lang = localStorage.getItem("language") || "it";
  const dropdown = document.getElementById("filter-category-dropdown");
  dropdown.innerHTML = "";

  const categories = [...new Set(mods.map(mod => mod.Categoria || '').filter(c => c !== ''))];

  categories.forEach(category => {
    const translatedCategory = translateCategory(category, lang);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = translatedCategory;
    checkbox.id = `category-${translatedCategory.replace(/\s+/g, "-").toLowerCase()}`;
    checkbox.onchange = filterTable;

    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.textContent = translatedCategory;

    dropdown.appendChild(checkbox);
    dropdown.appendChild(label);
    dropdown.appendChild(document.createElement("br"));
  });
}

function loadModsFromJson() {
  fetch('https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/mods.json')
    .then(response => response.json())
    .then(mods => {
      const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      const table = document.getElementById("mods-table").getElementsByTagName("tbody")[0];
      table.innerHTML = '';

      const lang = localStorage.getItem("language") || "it";
      const modKey = lang === "en" ? "MODEN" : "MODIT";
      const dlcKey = lang === "en" ? "DLCEN" : "DLCIT";
      const descriptionKey = lang === "en" ? "DescrizioneEN" : "DescrizioneIT";

      updateCategoryDropdown(mods);

      mods.forEach(mod => {
        const isFavorite = favorites.includes(mod.ModName);
        const newRow = table.insertRow();

        const translatedCategory = translateCategory(mod.Categoria || '', lang);

        newRow.setAttribute("data-categories", translatedCategory.toLowerCase());
        const tooltip = document.createElement("div");
        tooltip.classList.add("tooltip");

        tooltip.textContent = mod[descriptionKey] || (lang === "en" ? "No description available" : "Nessuna descrizione disponibile");

        const modLink = mod.SiteLink || '#';
        sessionStorage.setItem(mod.ModName, modLink);

        newRow.innerHTML = `
  <td>
    <span class="star-container">
      <span class="star ${isFavorite ? 'favorite' : ''}" onclick="toggleFavorite('${mod.ModName}')">&#9733;</span>
    </span>
  </td>
  <td>${mod.Author || ''}</td>
  <td class="mod-name" onmouseover="showTooltip(event, '${mod.ModName}')" onmouseout="hideTooltip(event)">
    ${mod.ModName || ''}
    <div class="tooltip">${mod[descriptionKey] || (lang === "en" ? "No description available" : "Nessuna descrizione disponibile")}</div>
  </td>
  <td>
    <span class="status ${(mod.Status || 'sconosciuta').toLowerCase()}">
      ${lang === "en" ? (translations[mod.Status.trim().charAt(0).toUpperCase() + mod.Status.trim().slice(1)] || mod.Status) : mod.Status}
    </span>
  </td>
  <td><a href="${modLink}" target="_blank" rel="noopener noreferrer">${lang === "en" ? "Visit" : "Visita"}</a></td>
  <td>${mod.DataUltimaModifica || ''}</td>
  <td>
    <span class="traduzione ${(mod.Translation || '').replace(" ", "-").toLowerCase()}">
      ${mod.Translation && mod.Translation !== "null" 
        ? (lang === "en" 
            ? (translationTranslations[mod.Translation] || mod.Translation).toUpperCase().replace("-", " ") 
            : mod.Translation.toUpperCase().replace("-", " "))
        : ''}
    </span>
  </td>
  <td>${mod[modKey] || ''}</td>
  <td>${mod[dlcKey] || ''}</td>
`;

        newRow.querySelector('.mod-name').appendChild(tooltip);
      });

      checkModUpdates(mods);
      filterTable();
    })
    .catch(error => console.error('Errore nel caricare il JSON:', error));
}

// Aggiorna anche la funzione sortTable per gestire le nuove colonne
function sortTable(columnIndex) {
  const table = document.getElementById("mods-table");
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

    // Gestione speciale per le colonne vuote
    if (valA === '' && valB !== '') return lastSortDirection === 'asc' ? 1 : -1;
    if (valA !== '' && valB === '') return lastSortDirection === 'asc' ? -1 : 1;
    if (valA === '' && valB === '') return 0;

    if (valA < valB) return lastSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return lastSortDirection === 'asc' ? 1 : -1;
    return 0;
  };

  rows.sort(compare);

  rows.forEach(row => table.appendChild(row));

  document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.classList.remove('asc', 'desc'));

  arrow.classList.add(lastSortDirection);

  lastSortedColumn = columnIndex;
}

function checkModUpdates(mods) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let savedMods = JSON.parse(localStorage.getItem("savedMods")) || {};

  let updatedMods = [];

  mods.forEach(mod => {
    if (favorites.includes(mod.ModName)) {
      let prevData = savedMods[mod.ModName];

      if (!prevData || prevData.Status !== mod.Status || prevData.DataUltimaModifica !== mod.DataUltimaModifica) {
        updatedMods.push(mod);
      }

      savedMods[mod.ModName] = {
        Status: mod.Status,
        DataUltimaModifica: mod.DataUltimaModifica
      };
    }
  });
  localStorage.setItem("savedMods", JSON.stringify(savedMods));

  const notificationTexts = {
    it: "Le seguenti mod preferite sono state modificate:\n",
    en: "The following favorite mods have been changed:\n"
  };
  const lang = localStorage.getItem("language") || "it";

  const statusLabel = lang === "it" ? "Stato" : "Status";

  if (updatedMods.length > 0) {
    let message = notificationTexts[lang] + 
                  updatedMods.map(mod => `${mod.ModName} - ${statusLabel}: ${mod.Status} (${mod.DataUltimaModifica})`).join("\n");
    alert(message);
  }
}

function sortTable(columnIndex) {
  const table = document.getElementById("mods-table");
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

  document.querySelectorAll('.sort-arrow').forEach(arrow => arrow.classList.remove('asc', 'desc'));

  arrow.classList.add(lastSortDirection);

  lastSortedColumn = columnIndex;
}

function filterTable() {
  const searchValue = document.getElementById("search").value.toLowerCase();

  const isEnglish = document.querySelector(".en-label").style.display !== "none";

  const selectedStatuses = Array.from(document.querySelectorAll('#filter-status-dropdown input:checked'))
                                .map(input => {
                                  let value = input.value;
                                  return isEnglish ? translations[value] : value; 
                                }).map(v => v.toLowerCase());

  const selectedTranslations = Array.from(document.querySelectorAll('#filter-translation-dropdown input:checked'))
                                     .map(input => {
                                       let value = input.value.toLowerCase();
                                       if (isEnglish) {
                                         return translationTranslations[value] ? translationTranslations[value].toLowerCase() : value; 
                                       } else {
                                         return value;
                                       }
                                     });

  const selectedCategories = Array.from(document.querySelectorAll('#filter-category-dropdown input:checked'))
                                   .map(input => input.value.toLowerCase());

  const filterFavorites = document.getElementById("filter-favorites").value.toLowerCase();

  const table = document.getElementById("mods-table");
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const modName = row.querySelector(".mod-name").textContent.toLowerCase();
    const author = row.cells[1].textContent.toLowerCase();
    let status = row.querySelector(".status").textContent.trim();
    status = isEnglish ? (translations[status] || status) : status;
    status = status.toLowerCase();
    const translation = row.querySelector(".traduzione").textContent.toLowerCase();
    const categories = row.getAttribute("data-categories").toLowerCase();
    const isFavorite = row.querySelector(".star").classList.contains("favorite");
    
    const matchesSearch = modName.includes(searchValue) || author.includes(searchValue);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    const matchesTranslation = selectedTranslations.length === 0 || selectedTranslations.some(translationVal => translation.includes(translationVal));
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(category => categories.includes(category));
    const matchesFavorites = !filterFavorites || (filterFavorites === 'true' ? isFavorite : !isFavorite);
    row.style.display = (matchesSearch && matchesStatus && matchesTranslation && matchesCategory && matchesFavorites) ? "" : "none";
  }
}

function toggleFavorite(modName) {
  const lang = localStorage.getItem("language") || "it";
  
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  
  if (favorites.includes(modName)) {
    favorites = favorites.filter(favorite => favorite !== modName);
    alert(modName + (lang === "en" ? " has been removed from favorites." : " è stata rimossa dai preferiti."));
  } else {
    favorites.push(modName);
    alert(modName + (lang === "en" ? " has been added to favorites!" : " è stata aggiunta ai preferiti!"));
  }
  
  localStorage.setItem("favorites", JSON.stringify(favorites));
  loadModsFromJson();
}

window.addEventListener("load", loadModsFromJson);