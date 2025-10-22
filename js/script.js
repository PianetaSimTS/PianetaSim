// Gestione del popup
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

// Gestione dropdown
function toggleDropdown(id) {
  var dropdown = document.getElementById(id);
  var button = dropdown.previousElementSibling;

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

// Gestione tooltip
function showTooltip(event, modName) {
  const tooltip = document.querySelector(`#${modName} .tooltip`);
  tooltip.style.display = 'block';
}

function hideTooltip(event) {
  const tooltip = event.target.querySelector('.tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Scroll to top
window.addEventListener("scroll", function () {
  const scrollToTopButton = document.getElementById("scrollToTop");
  if (window.scrollY > 300) {
    scrollToTopButton.style.display = "block";
  } else {
    scrollToTopButton.style.display = "none";
  }
});

document.getElementById("scrollToTop").addEventListener("click", function (e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Gestione sessionStorage
window.addEventListener('beforeunload', () => {
  Object.keys(sessionStorage)
    .filter(key => key !== 'favorites')
    .forEach(key => sessionStorage.removeItem(key)); 
});