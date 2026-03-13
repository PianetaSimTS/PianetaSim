// Variabili globali
let animazioniData = [];
let currentSortColumn = -1;
let currentSortDirection = 'asc';

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    // Carica i dati
    loadAnimazioniData();
    
    // Setup degli altri event listeners
    setupEventListeners();
    setupScrollToTop();
});

// Carica i dati delle animazioni da GitHub
function loadAnimazioniData() {
    const jsonUrl = 'https://raw.githubusercontent.com/PianetaSimTS/PianetaSim/refs/heads/main/Json/animazioniww18.json';
    
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Carica i preferiti dal localStorage
            const favorites = JSON.parse(localStorage.getItem('animazioniFavorites') || '[]');
            
            // Converti i dati dal formato JSON al formato interno
            animazioniData = data.map((item, index) => {
                const modName = item.Autore || `Animazione_${index + 1}`;
                
                return {
                    id: index + 1,
                    autore: item.Autore || '',
                    statoAnimazione: item.Status || '',
                    linkAnimazione: item.Link || '',
                    dataAggiornamentoAnimazione: item.DataAggiornamento || '',
                    descrizione: item.Descrizione || '',
                    favorite: favorites.includes(modName)
                };
            });
            
            populateTable(animazioniData);
        })
        .catch(error => {
            console.error('Errore nel caricamento dei dati:', error);
            const tbody = document.querySelector('#animazioni-table tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: red; padding: 20px;">
                        Errore nel caricamento dei dati dal repository GitHub.
                        <br><br>
                        Dettaglio errore: ${error.message}
                        <br>
                        URL tentato: ${jsonUrl}
                    </td>
                </tr>
            `;
        });
}

// FUNZIONE PER MOSTRARE IL TOOLTIP GLOBALE
function showGlobalTooltip(event, description) {
    hideGlobalTooltip();
    
    if (!description || description.trim() === '') return;
    
    const tooltip = document.createElement('div');
    tooltip.id = 'global-tooltip';
    tooltip.className = 'global-tooltip';
    tooltip.innerHTML = description;
    
    document.body.appendChild(tooltip);
    positionTooltip(event, tooltip);
}

// FUNZIONE PER POSIZIONARE IL TOOLTIP
function positionTooltip(event, tooltip) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = mouseX + 15;
    let top = mouseY + 15;
    
    if (left + tooltipWidth > windowWidth) {
        left = mouseX - tooltipWidth - 15;
    }
    
    if (top + tooltipHeight > windowHeight) {
        top = mouseY - tooltipHeight - 15;
    }
    
    if (left < 5) left = 5;
    if (top < 5) top = 5;
    
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

// Popola la tabella
function populateTable(data) {
    const tbody = document.querySelector('#animazioni-table tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 20px;">
                    Nessun dato disponibile
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        
        // COLONNA AUTORE
        const authorCell = document.createElement('td');
        authorCell.className = 'author-cell';
        authorCell.style.textAlign = 'center';
        authorCell.style.verticalAlign = 'middle';
        
        const authorContainer = document.createElement('div');
        authorContainer.className = 'author-with-star';
        authorContainer.style.display = 'inline-flex';
        authorContainer.style.alignItems = 'center';
        authorContainer.style.justifyContent = 'center';
        authorContainer.style.gap = '5px';
        authorContainer.style.width = '100%';
        
        const star = document.createElement('span');
        star.className = `star ${item.favorite ? 'favorite' : ''}`;
        star.innerHTML = '★';
        star.onclick = (e) => {
            e.stopPropagation();
            const modName = item.autore || `Animazione_${item.id}`;
            toggleFavorite(modName);
        };
        star.title = item.favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti";
        star.style.cursor = 'pointer';
        star.style.fontSize = '1.2em';
        star.style.color = item.favorite ? '#ffd700' : '#ccc';
        star.style.transition = 'color 0.3s';
        star.style.userSelect = 'none';
        
        let authorContent;
        if (item.linkAnimazione) {
            const authorLink = document.createElement('a');
            authorLink.href = item.linkAnimazione;
            authorLink.target = '_blank';
            authorLink.rel = 'noopener noreferrer';
            authorLink.textContent = item.autore || 'Sconosciuto';
            authorLink.className = 'mod-link';
            authorLink.style.textDecoration = 'underline';
            authorLink.style.color = '#007bff';
            authorLink.style.cursor = 'pointer';
            
            const escapedDescription = (item.descrizione || '')
                .replace(/`/g, "'")
                .replace(/"/g, '&quot;')
                .replace(/'/g, "\\'");
            
            authorLink.addEventListener('mouseenter', (e) => {
                if (escapedDescription && escapedDescription.trim() !== '') {
                    showGlobalTooltip(e, escapedDescription);
                }
            });
            
            authorLink.addEventListener('mouseleave', () => {
                hideGlobalTooltip();
            });
            
            authorLink.addEventListener('mousemove', (e) => {
                const tooltip = document.getElementById('global-tooltip');
                if (tooltip) {
                    positionTooltip(e, tooltip);
                }
            });
            
            authorContent = authorLink;
        } else {
            const authorName = document.createElement('span');
            authorName.textContent = item.autore || 'Sconosciuto';
            authorContent = authorName;
        }
        
        authorContainer.appendChild(star);
        authorContainer.appendChild(authorContent);
        authorCell.appendChild(authorContainer);
        row.appendChild(authorCell);

        // COLONNA STATO ANIMAZIONE
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        statusCell.style.verticalAlign = 'middle';
        
        const statusSpan = document.createElement('span');
        
        let statusText = item.statoAnimazione || 'sconosciuta';
        statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase();
        
        const statusLower = statusText.toLowerCase();
        let statusClass = 'sconosciuta';
        
        if (statusLower.includes('compatibil')) statusClass = 'compatibile';
        else if (statusLower.includes('aggiornat')) statusClass = 'aggiornata';
        else if (statusLower.includes('nuova')) statusClass = 'nuova';
        
        statusSpan.className = `status ${statusClass}`;
        statusSpan.textContent = statusText;
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);

        // COLONNA DATA AGGIORNAMENTO
        const dateCell = document.createElement('td');
        dateCell.textContent = item.dataAggiornamentoAnimazione || '';
        dateCell.style.textAlign = 'center';
        dateCell.style.verticalAlign = 'middle';
        row.appendChild(dateCell);

        tbody.appendChild(row);
    });
}

// Gestione preferiti
function toggleFavorite(modName) {
    let favorites = JSON.parse(localStorage.getItem("animazioniFavorites")) || [];
    
    if (favorites.includes(modName)) {
        favorites = favorites.filter(favorite => favorite !== modName);
        alert(modName + " è stata rimossa dai preferiti.");
    } else {
        favorites.push(modName);
        alert(modName + " è stata aggiunta ai preferiti!");
    }
    
    localStorage.setItem("animazioniFavorites", JSON.stringify(favorites));
    loadAnimazioniData();
}

// Filtra la tabella
function filterTable() {
    const searchTerm = document.getElementById('search')?.value.toLowerCase() || '';
    const favoriteFilter = document.getElementById('filter-favorites')?.value || '';
    
    const selectedStatuses = getSelectedStatuses();
    
    const filteredData = animazioniData.filter(item => {
        const matchesSearch = !searchTerm || 
            (item.autore && item.autore.toLowerCase().includes(searchTerm));
        
        const modName = item.autore || `Animazione_${item.id}`;
        const isFavorite = JSON.parse(localStorage.getItem("animazioniFavorites") || '[]').includes(modName);
        
        const matchesFavorite = favoriteFilter === '' || 
            (favoriteFilter === 'true' && isFavorite);
        
        let itemStatus = item.statoAnimazione || '';
        itemStatus = itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1).toLowerCase();
        
        const matchesStatus = selectedStatuses.length === 0 || 
            selectedStatuses.some(status => {
                const statusLower = status.toLowerCase();
                const itemStatusLower = itemStatus.toLowerCase();
                
                return statusLower === itemStatusLower;
            });
        
        return matchesSearch && matchesFavorite && matchesStatus;
    });
    
    populateTable(filteredData);
}

// Ottieni gli stati selezionati
function getSelectedStatuses() {
    const statuses = [];
    
    if (document.getElementById('status-compatibile')?.checked) statuses.push('Compatibile');
    if (document.getElementById('status-aggiornata')?.checked) statuses.push('Aggiornata');
    if (document.getElementById('status-nuova')?.checked) statuses.push('Nuova');
    
    return statuses;
}

// Ordinamento tabella
function sortTable(columnIndex) {
    if (currentSortColumn === columnIndex) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = columnIndex;
        currentSortDirection = 'asc';
    }
    
    const sortedData = [...animazioniData].sort((a, b) => {
        let aValue, bValue;
        
        switch(columnIndex) {
            case 0:
                aValue = a.autore || '';
                bValue = b.autore || '';
                break;
            case 1:
                aValue = a.statoAnimazione || '';
                bValue = b.statoAnimazione || '';
                break;
            case 2:
                const parseDate = (dateStr) => {
                    if (!dateStr) return new Date(0);
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        return new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                    return new Date(dateStr);
                };
                aValue = parseDate(a.dataAggiornamentoAnimazione);
                bValue = parseDate(b.dataAggiornamentoAnimazione);
                break;
            default:
                return 0;
        }
        
        if (currentSortDirection === 'asc') {
            return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        } else {
            return aValue < bValue ? 1 : (aValue > bValue ? -1 : 0);
        }
    });
    
    updateSortArrows();
    populateTable(sortedData);
}

// Aggiorna le frecce di ordinamento
function updateSortArrows() {
    document.querySelectorAll('.sort-arrow').forEach(arrow => {
        arrow.className = 'sort-arrow';
    });
    
    if (currentSortColumn >= 0) {
        const currentArrow = document.getElementById(`arrow-${currentSortColumn}`);
        if (currentArrow) {
            currentArrow.className = `sort-arrow ${currentSortDirection}`;
        }
    }
}

// Toggle dropdown
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    
    const favoriteFilter = document.getElementById('filter-favorites');
    if (favoriteFilter) {
        favoriteFilter.addEventListener('change', filterTable);
    }
    
    document.querySelectorAll('#filter-status-dropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', filterTable);
    });
    
    setupPopupButtons();
}

// Setup dei bottoni del popup
function setupPopupButtons() {
    const closeBtn = document.getElementById('close-btn');
    const downloadBtn = document.getElementById('download-btn');
    const helpSimBtn = document.getElementById('desc-mod-btn');
    
    if (closeBtn) {
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        const newCloseBtn = document.getElementById('close-btn');
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', function() {
                document.getElementById('popup').style.display = 'none';
            });
        }
    }
    
    if (downloadBtn) {
        downloadBtn.replaceWith(downloadBtn.cloneNode(true));
        const newDownloadBtn = document.getElementById('download-btn');
        if (newDownloadBtn) {
            newDownloadBtn.addEventListener('click', function() {
                window.open('https://github.com/PianetaSimTS/HelpSim/releases', '_blank');
            });
        }
    }
    
    if (helpSimBtn) {
        helpSimBtn.replaceWith(helpSimBtn.cloneNode(true));
        const newHelpSimBtn = document.getElementById('desc-mod-btn');
        if (newHelpSimBtn) {
            newHelpSimBtn.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('popup').style.display = 'flex';
            });
        }
    }
}

// Scroll to top functionality
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            scrollToTopBtn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
        });
        
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Esponi le funzioni globali
window.sortTable = sortTable;
window.toggleDropdown = toggleDropdown;
window.filterTable = filterTable;