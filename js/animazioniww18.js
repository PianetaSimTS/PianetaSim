// Variabili globali
let animazioniData = [];
let currentSortColumn = -1;
let currentSortDirection = 'asc';

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    loadAnimazioniData();
    setupEventListeners();
    setupScrollToTop();
});

// Carica i dati delle animazioni
function loadAnimazioniData() {
    fetch('data/animazioniww18.json')
        .then(response => response.json())
        .then(data => {
            animazioniData = data;
            populateTable(animazioniData);
            updateFavoriteFilter();
        })
        .catch(error => console.error('Errore nel caricamento dei dati:', error));
}

// Popola la tabella
function populateTable(data) {
    const tbody = document.querySelector('#animazioni-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Colonna Preferiti
        const favoriteCell = document.createElement('td');
        const starContainer = document.createElement('div');
        starContainer.className = 'star-container';
        const star = document.createElement('span');
        star.className = `star ${item.favorite ? 'favorite' : ''}`;
        star.innerHTML = '★';
        star.onclick = (e) => toggleFavorite(e, item.id);
        starContainer.appendChild(star);
        favoriteCell.appendChild(starContainer);
        row.appendChild(favoriteCell);

        // Autore
        const authorCell = document.createElement('td');
        authorCell.textContent = item.autore || '';
        row.appendChild(authorCell);

        // Stato Animazione
        const statusCell = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `status ${getStatusClass(item.statoAnimazione)}`;
        statusSpan.textContent = item.statoAnimazione || '';
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);

        // Link Animazione
        const linkCell = document.createElement('td');
        if (item.linkAnimazione) {
            const link = document.createElement('a');
            link.href = item.linkAnimazione;
            link.target = '_blank';
            link.textContent = 'Scarica';
            linkCell.appendChild(link);
        }
        row.appendChild(linkCell);

        // Data Aggiornamento
        const dateCell = document.createElement('td');
        dateCell.textContent = item.dataAggiornamentoAnimazione || '';
        row.appendChild(dateCell);

        // Note
        const noteCell = document.createElement('td');
        noteCell.textContent = item.note || '';
        row.appendChild(noteCell);

        tbody.appendChild(row);
    });
}

// Ottiene la classe CSS per lo stato
function getStatusClass(status) {
    const statusMap = {
        'Compatibile': 'compatibile',
        'Rotta': 'rotta',
        'Aggiornata': 'aggiornata',
        'Sconosciuta': 'sconosciuta',
        'Nuova': 'nuova',
        'Compatible': 'compatibile',
        'Broken': 'rotta',
        'Updated': 'aggiornata',
        'Unknown': 'sconosciuta',
        'New': 'nuova'
    };
    return statusMap[status] || 'sconosciuta';
}

// Gestione preferiti
function toggleFavorite(event, id) {
    event.stopPropagation();
    
    const item = animazioniData.find(item => item.id === id);
    if (item) {
        item.favorite = !item.favorite;
        const star = event.target;
        star.classList.toggle('favorite', item.favorite);
        
        // Salva nei preferiti nel localStorage
        saveFavorites();
        filterTable();
    }
}

// Salva i preferiti nel localStorage
function saveFavorites() {
    const favorites = animazioniData
        .filter(item => item.favorite)
        .map(item => item.id);
    localStorage.setItem('animazioniFavorites', JSON.stringify(favorites));
}

// Carica i preferiti dal localStorage
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('animazioniFavorites') || '[]');
    animazioniData.forEach(item => {
        item.favorite = favorites.includes(item.id);
    });
}

// Filtra la tabella
function filterTable() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const favoriteFilter = document.getElementById('filter-favorites').value;
    
    // Ottieni gli stati selezionati
    const selectedStatuses = getSelectedStatuses();
    
    const filteredData = animazioniData.filter(item => {
        const matchesSearch = !searchTerm || 
            (item.autore && item.autore.toLowerCase().includes(searchTerm)) ||
            (item.note && item.note.toLowerCase().includes(searchTerm));
        
        const matchesFavorite = favoriteFilter === '' || 
            (favoriteFilter === 'true' && item.favorite) ||
            (favoriteFilter === 'false' && !item.favorite);
        
        const matchesStatus = selectedStatuses.length === 0 || 
            selectedStatuses.includes(item.statoAnimazione);
        
        return matchesSearch && matchesFavorite && matchesStatus;
    });
    
    populateTable(filteredData);
}

// Ottieni gli stati selezionati
function getSelectedStatuses() {
    const statuses = [];
    const isItalian = document.getElementById('language-label').textContent === 'Italiano';
    
    if (isItalian) {
        if (document.getElementById('status-compatibile')?.checked) statuses.push('Compatibile');
        if (document.getElementById('status-rotta')?.checked) statuses.push('Rotta');
        if (document.getElementById('status-aggiornata')?.checked) statuses.push('Aggiornata');
        if (document.getElementById('status-sconosciuta')?.checked) statuses.push('Sconosciuta');
        if (document.getElementById('status-nuova')?.checked) statuses.push('Nuova');
    } else {
        if (document.getElementById('status-compatible')?.checked) statuses.push('Compatible');
        if (document.getElementById('status-broken')?.checked) statuses.push('Broken');
        if (document.getElementById('status-updated')?.checked) statuses.push('Updated');
        if (document.getElementById('status-unknown')?.checked) statuses.push('Unknown');
        if (document.getElementById('status-new')?.checked) statuses.push('New');
    }
    
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
    
    animazioniData.sort((a, b) => {
        let aValue, bValue;
        
        switch(columnIndex) {
            case 0: // Preferiti
                aValue = a.favorite ? 1 : 0;
                bValue = b.favorite ? 1 : 0;
                break;
            case 1: // Autore
                aValue = a.autore || '';
                bValue = b.autore || '';
                break;
            case 2: // Stato
                aValue = a.statoAnimazione || '';
                bValue = b.statoAnimazione || '';
                break;
            case 3: // Link
                aValue = a.linkAnimazione || '';
                bValue = b.linkAnimazione || '';
                break;
            case 4: // Data
                aValue = new Date(a.dataAggiornamentoAnimazione || '');
                bValue = new Date(b.dataAggiornamentoAnimazione || '');
                break;
            case 5: // Note
                aValue = a.note || '';
                bValue = b.note || '';
                break;
            default:
                return 0;
        }
        
        if (currentSortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    updateSortArrows();
    populateTable(animazioniData);
}

// Aggiorna le frecce di ordinamento
function updateSortArrows() {
    // Rimuovi tutte le frecce esistenti
    document.querySelectorAll('.sort-arrow').forEach(arrow => {
        arrow.className = 'sort-arrow';
    });
    
    // Aggiungi la freccia alla colonna corrente
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
    // Search
    document.getElementById('search').addEventListener('input', filterTable);
    
    // Filtro preferiti
    document.getElementById('filter-favorites').addEventListener('change', filterTable);
    
    // Checkbox stati
    document.querySelectorAll('#filter-status-dropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', filterTable);
    });
    
    // Click outside per chiudere dropdown
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#filter-status-dropdown') && 
            !event.target.closest('button[onclick*="filter-status-dropdown"]')) {
            const dropdown = document.getElementById('filter-status-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        }
    });
    
    // Help Sim popup
    document.getElementById('desc-mod-btn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('popup').style.display = 'block';
    });
    
    document.getElementById('close-btn').addEventListener('click', function() {
        document.getElementById('popup').style.display = 'none';
    });
    
    document.getElementById('download-btn').addEventListener('click', function() {
        // Aggiungi qui la logica per il download
        alert('Download functionality to be implemented');
    });
}

// Scroll to top functionality
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Aggiorna filtro preferiti in base alla lingua
function updateFavoriteFilter() {
    const filter = document.getElementById('filter-favorites');
    const isItalian = document.getElementById('language-label').textContent === 'Italiano';
    
    if (isItalian) {
        filter.innerHTML = `
            <option value="">Tutte</option>
            <option value="true">Preferite</option>
            <option value="false">Non Preferite</option>
        `;
    } else {
        filter.innerHTML = `
            <option value="">All</option>
            <option value="true">Favorites</option>
            <option value="false">No Favorites</option>
        `;
    }
}

// Esponi le funzioni globali
window.sortTable = sortTable;
window.toggleDropdown = toggleDropdown;
window.filterTable = filterTable;