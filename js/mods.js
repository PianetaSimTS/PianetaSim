let lastSortedColumn = -1;
let lastSortDirection = 'asc';

// Funzione per formattare i requisiti in grassetto
function formatRequirements(text) {
  if (!text) return '';
  
  // Aggiunge grassetto alle parole chiave
  const keywords = ['necessari', 'consigliati', 'necessarie', 'attenzione', 'raccomandati', 'required', 'recommended', 'attention'];
  
  let formattedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedText = formattedText.replace(regex, '<strong>$&</strong>');
  });
  
  return formattedText;
}

function separateModsAndDlc(dependencyString) {
  if (!dependencyString) {
    return { mods: '', dlc: '' };
  }
  
  const mods = [];
  const dlc = [];
  
  const parts = dependencyString.split(' - ');
  
  parts.forEach(part => {
    if (part.startsWith('MOD:')) {
      mods.push(part.replace('MOD:', '').trim());
    } else if (part.startsWith('DLC:')) {
      dlc.push(part.replace('DLC:', '').trim());
    }
  });
  
  return {
    mods: mods.join(', '),
    dlc: dlc.join(', ')
  };
}

// Funzione per aggiornare il dropdown delle categorie
function updateCategoryDropdown(mods) {
  const dropdown = document.getElementById("filter-category-dropdown");
  dropdown.innerHTML = "";

  const categories = [...new Set(mods.map(mod => mod.Categoria || '').filter(c => c !== ''))];

  categories.forEach(category => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = category;
    checkbox.id = `category-${category.replace(/\s+/g, "-").toLowerCase()}`;
    checkbox.onchange = filterTable;

    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.textContent = category;

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

      // Crea una mappa delle mod per nome e per nome+autore
      const modMap = new Map();
      const modByNameAndAuthor = new Map();
      
      mods.forEach(mod => {
        // Mappa per nome esatto
        modMap.set(mod.ModName, mod);
        
        // Mappa per nome + "di" + autore (in lowercase per confronto case-insensitive)
        if (mod.Author) {
          const key = `${mod.ModName.toLowerCase()} di ${mod.Author.toLowerCase()}`;
          modByNameAndAuthor.set(key, mod);
        }
      });

      // Aggiorna il dropdown delle categorie PRIMA di popolare la tabella
      updateCategoryDropdown(mods);

      mods.forEach(mod => {
        const isFavorite = favorites.includes(mod.ModName);
        const newRow = table.insertRow();

        newRow.setAttribute("data-categories", (mod.Categoria || '').toLowerCase());
        // Crea un ID univoco per la riga (rimuovi caratteri speciali)
        const rowId = `mod-${mod.ModName.replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}`;
        newRow.id = rowId;

        const modLink = mod.SiteLink || '#';
        const translatorLink = mod.LinkTraduzione || '';

        // Formatta i requisiti con grassetto e link alle mod necessarie
        const formattedModReqs = formatModRequirements(mod.MODIT || '', mods);
        const formattedDlcReqs = formatRequirements(mod.DLCIT || '');
        
        // Ottieni le note
        const note = mod.NoteIT || '';

        // Creazione dell'autore con stellina
        const authorWithStar = `
          <span class="author-with-star">
            <span class="star ${isFavorite ? 'favorite' : ''}" onclick="toggleFavorite('${mod.ModName.replace(/'/g, "\\'")}')">&#9733;</span>
            ${mod.Author || ''}
          </span>
        `;

        // Creazione del link del traduttore
const translatorCell = translatorLink 
    ? `<a href="${translatorLink}" target="_blank" rel="noopener noreferrer" class="translator-link">${mod.Traduttore || ''}</a>`
    : (mod.Traduttore ? `<span class="translator-name">${mod.Traduttore}</span>` : '');

        // Ottieni la descrizione
        const description = mod.DescrizioneIT || "Nessuna descrizione disponibile";
        
        // Escape delle virgolette per evitare errori JavaScript
        const escapedDescription = description
          .replace(/`/g, "'")
          .replace(/"/g, '&quot;')
          .replace(/'/g, "\\'");

        newRow.innerHTML = `
          <td class="author-cell">${authorWithStar}</td>
          <td class="mod-name">
              <a href="${modLink}" target="_blank" rel="noopener noreferrer" class="mod-link" 
                 onmouseover="showGlobalTooltip(event, '${escapedDescription}')" 
                 onmouseout="hideGlobalTooltip()">
                  ${mod.ModName || ''}
              </a>
          </td>
          <td>
              <span class="status ${(mod.Status || 'sconosciuta').toLowerCase()}">
                  ${mod.Status}
              </span>
          </td>
          <td>${mod.DataUltimaModifica || ''}</td>
          <td>
              <span class="traduzione ${(mod.Translation || '').replace(" ", "-").toLowerCase()}">
                  ${mod.Translation && mod.Translation !== "null" ? mod.Translation.toUpperCase() : ''}
              </span>
          </td>
<td class="translation-download-cell">
  ${translatorCell}
  <span class="translation-date">${mod.DataTraduzione || ''}</span>
</td>
          <td>${formattedModReqs}</td>
          <td>${formattedDlcReqs}</td>
          <td>${note}</td>
        `;
      });

      checkModUpdates(mods);
      
      // Applica i filtri dopo aver popolato la tabella
      setTimeout(() => {
        filterTable();
      }, 50);
    })
    .catch(error => console.error('Errore nel caricare il JSON:', error));
}

// Funzione per formattare i requisiti con link alle mod
// Funzione per formattare i requisiti con link alle mod
function formatModRequirements(text, modsList) {
  if (!text) return '';
  
  // Prima applica il grassetto alle parole chiave
  const keywords = ['necessari', 'necessarie', 'consigliati', 'attenzione', 'raccomandati', 'required', 'recommended', 'attention'];
  
  let formattedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedText = formattedText.replace(regex, '<strong>$&</strong>');
  });
  
  // Crea una mappa delle mod per facile accesso
  const modMap = new Map();
  modsList.forEach(mod => {
    // Mappa per nome esatto
    modMap.set(mod.ModName.toLowerCase(), mod);
    
    // Mappa per nome + "di" + autore
    if (mod.Author) {
      const key = `${mod.ModName.toLowerCase()} di ${mod.Author.toLowerCase()}`;
      modMap.set(key, mod);
      
      // Aggiungi anche senza "di" per flessibilità
      const keyWithoutDi = `${mod.ModName.toLowerCase()} ${mod.Author.toLowerCase()}`;
      modMap.set(keyWithoutDi, mod);
    }
  });
  
  // Trova tutte le mod menzionate nel testo
  let result = formattedText;
  
  // Ordina le mod per lunghezza del nome (dalla più lunga alla più corta)
  // per evitare sostituzioni parziali
  const sortedMods = [...modsList].sort((a, b) => 
    (b.ModName.length + (b.Author?.length || 0)) - 
    (a.ModName.length + (a.Author?.length || 0))
  );
  
  // Per ogni mod, cerca il suo nome nel testo
  sortedMods.forEach(mod => {
    if (!mod.SiteLink || mod.SiteLink === '#') return;
    
    // Costruisci le varianti del nome da cercare
    const variants = [
      mod.ModName,
      `${mod.ModName} di ${mod.Author}`,
      `${mod.ModName} di ${mod.Author?.split(' ')[0]}`, // Solo primo nome dell'autore
    ].filter(v => v && v.length > 3);
    
    variants.forEach(variant => {
      // Escape dei caratteri speciali per la regex
      const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Crea una regex che cerca il variant come parola intera
      // ma permette punteggiatura dopo
      const regex = new RegExp(`(${escapedVariant})(?=[\\s,;.:!?\\-]|$)`, 'gi');
      
      // Sostituisci con link se trovato
      result = result.replace(regex, (match) => {
        // Evita di sostituire se è già dentro un link
        const matchIndex = result.indexOf(match);
        const beforeMatch = result.substring(0, matchIndex);
        const lastLinkOpen = beforeMatch.lastIndexOf('<a');
        const lastLinkClose = beforeMatch.lastIndexOf('</a>');
        
        // Se siamo dentro un link, non sostituire
        if (lastLinkOpen > lastLinkClose) {
          return match;
        }
        
        return `<a href="${mod.SiteLink}" target="_blank" rel="noopener noreferrer" class="mod-requirement-link">${match}</a>`;
      });
    });
  });
  
  return result;
}

// Funzione per scorrere fino alla mod specificata
function scrollToMod(modId) {
  const modRow = document.getElementById(modId);
  if (modRow) {
    // Evidenzia temporaneamente la riga
    modRow.style.transition = 'background-color 0.5s';
    modRow.style.backgroundColor = '#ffff99';
    
    // Scorri fino alla riga
    modRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Rimuovi l'evidenziazione dopo 2 secondi
    setTimeout(() => {
      modRow.style.backgroundColor = '';
    }, 2000);
  }
  return false;
}

// FUNZIONE PER MOSTRARE IL TOOLTIP GLOBALE
function showGlobalTooltip(event, description) {
  // Rimuovi qualsiasi tooltip esistente
  hideGlobalTooltip();
  
  // Crea il tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'global-tooltip';
  tooltip.className = 'global-tooltip';
  tooltip.innerHTML = description;
  
  // Aggiungi al body
  document.body.appendChild(tooltip);
  
  // Posiziona il tooltip vicino al mouse
  positionTooltip(event, tooltip);
}

// FUNZIONE PER POSIZIONARE IL TOOLTIP
function positionTooltip(event, tooltip) {
  // Ottieni la posizione del mouse
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  // Dimensione del tooltip
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  
  // Dimensioni della finestra
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Calcola la posizione iniziale (sotto il mouse)
  let left = mouseX + 15;
  let top = mouseY + 15;
  
  // Se il tooltip esce a destra, spostalo a sinistra del mouse
  if (left + tooltipWidth > windowWidth) {
    left = mouseX - tooltipWidth - 15;
  }
  
  // Se il tooltip esce in basso, spostalo sopra il mouse
  if (top + tooltipHeight > windowHeight) {
    top = mouseY - tooltipHeight - 15;
  }
  
  // Assicurati che non esca dalla finestra in alto o a sinistra
  if (left < 5) left = 5;
  if (top < 5) top = 5;
  
  // Applica la posizione
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

// FUNZIONE PER NASCONDERE IL TOOLTIP GLOBALE
function hideGlobalTooltip() {
  const tooltip = document.getElementById('global-tooltip');
  if (tooltip) {
    tooltip.remove();
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

    // Per la colonna autore, rimuovi la stellina dalla comparazione
    if (columnIndex === 0) {
      valA = valA.replace('★', '').trim();
      valB = valB.replace('★', '').trim();
    }

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

  if (updatedMods.length > 0) {
    let message = "Le seguenti mod preferite sono state modificate:\n" + 
                  updatedMods.map(mod => `${mod.ModName} - Stato: ${mod.Status} (${mod.DataUltimaModifica})`).join("\n");
    alert(message);
  }
}

// FUNZIONE filterTable
function filterTable() {
  const searchValue = document.getElementById("search").value.toLowerCase();

  const selectedStatuses = Array.from(document.querySelectorAll('#filter-status-dropdown input:checked'))
                                .map(input => input.value.toLowerCase());

  const selectedTranslations = Array.from(document.querySelectorAll('#filter-translation-dropdown input:checked'))
                                     .map(input => input.value.toLowerCase());

  const selectedCategories = Array.from(document.querySelectorAll('#filter-category-dropdown input:checked'))
                                   .map(input => input.value.toLowerCase());

  const filterFavorites = document.getElementById("filter-favorites").value;

  const table = document.getElementById("mods-table");
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const modName = row.querySelector(".mod-name").textContent.toLowerCase();
    const author = row.cells[0].textContent.toLowerCase().replace('★', '').trim();
    
    const status = row.querySelector(".status").textContent.trim().toLowerCase();
    const translation = row.querySelector(".traduzione").textContent.toLowerCase();
    const categories = row.getAttribute("data-categories").toLowerCase();
    const isFavorite = row.querySelector(".star").classList.contains("favorite");
    
    const matchesSearch = modName.includes(searchValue) || author.includes(searchValue);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    const matchesTranslation = selectedTranslations.length === 0 || selectedTranslations.some(t => translation.includes(t));
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(category => categories.includes(category));
    const matchesFavorites = !filterFavorites || (filterFavorites === 'true' ? isFavorite : true);
    
    row.style.display = (matchesSearch && matchesStatus && matchesTranslation && matchesCategory && matchesFavorites) ? "" : "none";
  }
}

function formatTranslationCell(translationStatus) {
  if (!translationStatus || translationStatus === "null") return '';
  
  // Mappa delle classi CSS per ogni stato traduzione
  const translationClasses = {
    "inclusa": "traduzione inclusa",
    "non necessaria": "traduzione non-necessaria",
    "da scaricare": "traduzione da-scaricare",
    "in lavorazione": "traduzione in-lavorazione",
    "da controllare": "traduzione da-controllare",
    "nuova": "traduzione nuova"
  };
  
  const statusKey = translationStatus.toLowerCase().replace("-", " ").replace("_", " ");
  const cssClass = translationClasses[statusKey] || "traduzione";
  
  return `<span class="${cssClass}">${translationStatus.toUpperCase()}</span>`;
}

function toggleFavorite(modName) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  
  if (favorites.includes(modName)) {
    favorites = favorites.filter(favorite => favorite !== modName);
    alert(modName + " è stata rimossa dai preferiti.");
  } else {
    favorites.push(modName);
    alert(modName + " è stata aggiunta ai preferiti!");
  }
  
  localStorage.setItem("favorites", JSON.stringify(favorites));
  loadModsFromJson();
}

window.addEventListener("load", loadModsFromJson);