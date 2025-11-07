// script-series.js
const TMDB_API_KEY = "995449ccaf6d840acc029f95c7d210dd";
const DATA_URL = `./data-series.json?nocache=${Date.now()}`;
const SERIES_LINKS_URL = `./series-links.json?nocache=${Date.now()}`;

let allSeries = [];
let currentSearchTerm = '';
let seriesLinksData = {};
let isInDetailsView = false;

// Variables simplificadas para carouseles
let carousels = {};

// Función para alternar la visibilidad del buscador
function toggleSearch() {
  const searchContainer = document.getElementById('searchContainer');
  const isActive = searchContainer.classList.contains('active');
  
  if (!isActive) {
    searchContainer.classList.add('active');
    setTimeout(() => {
      document.getElementById('search').focus();
    }, 100);
  } else {
    closeSearch();
  }
}

// Función para cerrar la búsqueda
function closeSearch() {
  const searchContainer = document.getElementById('searchContainer');
  const searchInput = document.getElementById('search');
  
  searchContainer.classList.remove('active');
  searchInput.value = '';
  currentSearchTerm = '';
  
  // Restaurar vista normal si estaba en búsqueda
  if (allSeries.length > 0) {
    renderAllSections();
  }
}

// Cerrar buscador al hacer clic fuera o con Escape
document.addEventListener('click', (e) => {
  const searchContainer = document.getElementById('searchContainer');
  const searchToggle = document.querySelector('.search-toggle');
  
  if (!searchContainer.contains(e.target) && 
      !searchToggle.contains(e.target)) {
    closeSearch();
  }
});

// Cerrar con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer.classList.contains('active')) {
      closeSearch();
    }
  }
});

// ===================================================
// CARGA DE SERIES
// ===================================================
async function loadSeries() {
  try {
    showLoading();
    const res = await fetch(DATA_URL);
    const data = await res.json();
    allSeries = data.seriesData || data;
    
    renderAllSections();
    initializeCarouselControls();
    
  } catch (err) {
    console.error('Error al cargar series:', err);
    showError();
  }
}

function showLoading() {
  document.getElementById("series").innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
      <div style="font-size: 1.5rem;">Cargando series...</div>
    </div>
  `;
}

function showError() {
  document.getElementById("series").innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
      <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar series</p>
      <button onclick="loadSeries()" style="margin-top: 20px; padding: 12px 24px; background: var(--rojo); color: white; border: none; border-radius: 25px; cursor: pointer;">
        Reintentar
      </button>
    </div>
  `;
}

function updateSeriesCount(count) {
  document.getElementById('seriesCount').textContent = `${count} ${count === 1 ? 'serie' : 'series'}`;
}

// ===================================================
// RENDERIZADO DE SECCIONES
// ===================================================
function renderAllSections() {
  renderSeries(allSeries);
  renderNewReleases();
  updateSeriesCount(allSeries.length);
}

function renderNewReleases() {
  const newReleases = allSeries.filter(series => series.isNew);
  const carousel = document.getElementById('newReleasesCarousel');
  const section = document.getElementById('newReleasesSection');
  
  if (newReleases.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  carousel.innerHTML = '';
  
  newReleases.forEach((series, index) => {
    const carouselItem = createCarouselItem(series, index);
    carousel.appendChild(carouselItem);
  });
  
  // Inicializar carousel
  initializeCarousel('newReleases', newReleases.length);
}

function createCarouselItem(series, index) {
  const carouselItem = document.createElement('div');
  carouselItem.className = 'carousel-item';
  carouselItem.style.animationDelay = `${(index % 8) * 0.05}s`;
  
  carouselItem.innerHTML = `
    ${series.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
    <img src="${series.image}" alt="${series.title}" class="carousel-poster" 
         onerror="this.src='https://via.placeholder.com/300x450/2d2d2d/ffffff?text=Imagen+No+Disponible'"
         loading="lazy">
    <div class="carousel-info">
      <div class="carousel-title">${series.title}</div>
      <div class="carousel-year">${series.year}</div>
    </div>
  `;
  carouselItem.onclick = () => showDetails(series);
  return carouselItem;
}

function renderSeries(series) {
  const seriesContainer = document.getElementById("series");
  
  if (series.length === 0) {
    seriesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
        <p style="font-size: 1.3rem; margin-bottom: 15px;">🔍 No se encontraron series</p>
      </div>
    `;
    updateSeriesCount(0);
    return;
  }
  
  seriesContainer.innerHTML = '';
  series.forEach((series, index) => {
    const seriesCard = createSeriesCard(series, index);
    seriesContainer.appendChild(seriesCard);
  });
  
  updateSeriesCount(series.length);
}

function createSeriesCard(series, index) {
  const seriesCard = document.createElement("div");
  seriesCard.className = "series-card";
  seriesCard.style.animationDelay = `${(index % 8) * 0.05}s`;
  
  seriesCard.innerHTML = `
    ${series.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
    <img src="${series.image}" alt="${series.title}" class="series-poster" 
         onerror="this.src='https://via.placeholder.com/300x450/2d2d2d/ffffff?text=Imagen+No+Disponible'"
         loading="lazy">
    <div class="series-info">
      <div class="series-title">${series.title}</div>
      <div class="series-year">${series.year}</div>
    </div>
  `;
  seriesCard.onclick = () => showDetails(series);
  return seriesCard;
}

// ===================================================
// SISTEMA DE CAROUSEL SIMPLIFICADO
// ===================================================
function initializeCarousel(name, itemCount) {
  const container = document.getElementById(`${name}CarouselContainer`);
  const element = document.getElementById(`${name}Carousel`);
  
  if (!container || !element) return;
  
  carousels[name] = {
    element: element,
    position: 0,
    maxPosition: calculateMaxPosition(container, itemCount)
  };
}

function calculateMaxPosition(container, itemCount) {
  const containerWidth = container.offsetWidth;
  const itemWidth = 220 + 15; // 180px + 20px gap
  const visibleItems = Math.floor(containerWidth / itemWidth);
  return Math.max(0, itemCount - visibleItems);
}

function initializeCarouselControls() {
  // Controles para estrenos
  document.getElementById('newReleasesPrev').addEventListener('click', () => moveCarousel('newReleases', -1));
  document.getElementById('newReleasesNext').addEventListener('click', () => moveCarousel('newReleases', 1));
}

function moveCarousel(name, direction) {
  const carousel = carousels[name];
  if (!carousel) return;
  
  const newPosition = carousel.position + direction;
  
  if (newPosition >= 0 && newPosition <= carousel.maxPosition) {
    carousel.position = newPosition;
    updateCarouselPosition(carousel);
  }
}

function updateCarouselPosition(carousel) {
  const translateX = -carousel.position * (180 + 20);
  carousel.element.style.transform = `translateX(${translateX}px)`;
}

// ===================================================
// SISTEMA DE BÚSQUEDA
// ===================================================
function setupSearch() {
  const searchInput = document.getElementById("search");
  
  searchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value.trim().toLowerCase();
    
    if (currentSearchTerm === '') {
      renderAllSections();
      return;
    }
    
    const filteredSeries = allSeries.filter(series => 
      series.title.toLowerCase().includes(currentSearchTerm) ||
      (series.genres && series.genres.some(genre => 
        genre.toLowerCase().includes(currentSearchTerm)
      ))
    );
    
    renderSeries(filteredSeries);
    document.getElementById('newReleasesSection').style.display = 'none';
  });
}

// ===================================================
// VISTA DE DETALLES
// ===================================================
async function showDetails(series) {
  isInDetailsView = true;
  
  // Ocultar header y main container
  document.getElementById("header").classList.add("hidden");
  document.getElementById("mainContainer").classList.add("hidden");
  
  // Ocultar menú inferior
  document.querySelector('.bottom-nav').style.display = 'none';
  
  history.pushState({ detailView: true }, '', `#${series.id}`);
  
  const detailsContainer = document.getElementById("details");
  const detailsContent = document.getElementById("details-content");
  
  // Mostrar loading
  detailsContent.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--negro);">
      <div style="text-align: center; color: var(--texto-secundario);">
        <div style="font-size: 1.5rem; margin-bottom: 15px;">Cargando detalles...</div>
        <div style="width: 40px; height: 40px; border: 3px solid var(--gris-claro); border-top: 3px solid var(--rojo); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
    </div>
  `;
  
  detailsContainer.style.display = 'block';
  await loadSeriesDetails(series);
}

async function loadSeriesDetails(series) {
  try {
    const detailsContent = document.getElementById("details-content");
    
    const [seriesDetails, trailerData] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/tv/${series.id}?api_key=${TMDB_API_KEY}&language=es-ES`).then(res => res.json()),
      fetch(`https://api.themoviedb.org/3/tv/${series.id}/videos?api_key=${TMDB_API_KEY}&language=es-ES`).then(res => res.json())
    ]);
    
    const trailer = trailerData.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
    
    // Formatear fecha de lanzamiento
    const releaseDate = seriesDetails.first_air_date ?
      new Date(seriesDetails.first_air_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'No disponible';
    
    detailsContent.innerHTML = `
      <button class="back-button" onclick="showList()">←</button>
      
      <div class="details-hero">
        <div class="trailer-hero">
          ${trailer ?
            `<iframe class="trailer-frame" 
                    src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=1&showinfo=0&rel=0" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>` :
            `<div class="trailer-placeholder">
              <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📺</div>
                <div>Tráiler no disponible</div>
              </div>
            </div>`
          }
        </div>
        <div class="hero-gradient"></div>
        <div class="hero-overlay"></div>
      </div>
      
      <div class="details-content">
        <div class="details-info">
          <h1 class="details-title">${series.title}</h1>
          
          <div class="details-meta">
            <span class="details-year">${series.year}</span>
            <div class="details-genres">
              ${(series.genres || []).map(genre => `<span class="details-genre">${genre}</span>`).join('')}
            </div>
          </div>
          
          <p class="details-overview">${seriesDetails.overview || "Sin descripción disponible."}</p>
          
          <!-- SELECTOR DE TEMPORADAS MOVIDO AQUÍ, ANTES DE LA INFORMACIÓN -->
          <div class="season-selector-section">
            <h3 class="season-section-title">Temporadas y Episodios</h3>
            <div class="season-selector-container">
              <div class="season-selector">
                <button class="season-selector-toggle" id="seasonToggle">
                  <span>Seleccionar Temporada</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div class="season-dropdown" id="seasonDropdown">
                  ${generateSeasonOptions(seriesDetails.seasons || [], series.id)}
                </div>
              </div>
              <div class="episodes-container" id="episodesContainer"></div>
            </div>
          </div>
          
          <div class="details-extra">
            <h3 class="extra-title">Información de la serie</h3>
            <div class="extra-grid">
              <div class="extra-item">
                <span class="extra-label">Temporadas</span>
                <span class="extra-value">${seriesDetails.number_of_seasons || 'No disponible'}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Episodios</span>
                <span class="extra-value">${seriesDetails.number_of_episodes || 'No disponible'}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Fecha de estreno</span>
                <span class="extra-value">${releaseDate}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Estado</span>
                <span class="extra-value">${seriesDetails.status || 'No disponible'}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Calificación</span>
                <span class="extra-value">${seriesDetails.vote_average ? seriesDetails.vote_average.toFixed(1) + '/10' : 'No disponible'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Inicializar el selector de temporadas después de un breve delay
    setTimeout(initializeSeasonSelector, 100);
    
  } catch (err) {
    console.error('Error al cargar detalles:', err);
    const detailsContent = document.getElementById("details-content");
    detailsContent.innerHTML = `
      <div style="text-align: center; padding: 80px; color: var(--texto-secundario); background: var(--negro); min-height: 100vh;">
        <button class="back-button" onclick="showList()">←</button>
        <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar detalles</p>
        <button onclick="showList()" style="margin-top: 20px; padding: 12px 24px; background: var(--rojo); color: white; border: none; border-radius: 25px; cursor: pointer;">
          Volver al catálogo
        </button>
      </div>
    `;
  }
}

// ===================================================
// SELECTOR DE TEMPORADAS
// ===================================================
function generateSeasonOptions(seasons, seriesId) {
  const availableSeasons = seriesLinksData[seriesId]?.seasons || {};
  
  return seasons.map(season => {
    const seasonNum = season.season_number;
    const hasEpisodes = availableSeasons[seasonNum] && Object.keys(availableSeasons[seasonNum].episodes || {}).length > 0;
    const episodeCount = hasEpisodes ? Object.keys(availableSeasons[seasonNum].episodes).length : 0;
    
    return `
      <div class="season-option ${hasEpisodes ? 'available' : 'unavailable'}" 
           data-season="${seasonNum}" 
           onclick="selectSeason(${seriesId}, ${seasonNum}, '${(season.name || `Temporada ${seasonNum}`).replace(/'/g, "\\'")}')">
        <span class="season-option-text">
          ${season.name || `Temporada ${seasonNum}`}
          ${episodeCount > 0 ? ` (${episodeCount} episodios)` : ''}
        </span>
        ${!hasEpisodes ? '<span class="no-episodes-badge">No disponible</span>' : ''}
      </div>
    `;
  }).join('');
}

function selectSeason(seriesId, seasonNumber, seasonName) {
  const seriesData = seriesLinksData[seriesId];
  const episodes = seriesData?.seasons?.[seasonNumber]?.episodes || {};
  
  const episodesContainer = document.getElementById('episodesContainer');
  const seasonToggle = document.getElementById('seasonToggle');
  const seasonDropdown = document.getElementById('seasonDropdown');
  
  // Actualizar el texto del toggle
  seasonToggle.querySelector('span').textContent = seasonName;
  
  // Cerrar el dropdown
  seasonDropdown.classList.remove('active');
  document.querySelector('.season-selector-section').classList.remove('dropdown-open');
  
  // Generar episodios
  if (Object.keys(episodes).length > 0) {
    episodesContainer.innerHTML = `
      <div class="episodes-grid">
        ${Object.entries(episodes).map(([epNum, episode]) => `
          <div class="episode-card" 
               onclick="playEpisode(${seriesId}, ${seasonNumber}, ${epNum}, '${episode.title.replace(/'/g, "\\'")}')">
            <div class="episode-number">${epNum}</div>
            <div class="episode-title">${episode.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    episodesContainer.innerHTML = `
      <div class="no-episodes-message">
        No hay episodios disponibles para esta temporada
      </div>
    `;
  }
  
  // Mostrar el contenedor de episodios con animación
  episodesContainer.style.display = 'block';
  setTimeout(() => {
    episodesContainer.classList.add('active');
  }, 10);
}

function initializeSeasonSelector() {
  const seasonToggle = document.getElementById('seasonToggle');
  const seasonDropdown = document.getElementById('seasonDropdown');
  
  if (seasonToggle && seasonDropdown) {
    seasonToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      seasonDropdown.classList.toggle('active');
      
      // Si se abre el dropdown, agregar clase al contenedor padre
      if (seasonDropdown.classList.contains('active')) {
        document.querySelector('.season-selector-section').classList.add('dropdown-open');
      } else {
        document.querySelector('.season-selector-section').classList.remove('dropdown-open');
      }
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!seasonToggle.contains(e.target) && !seasonDropdown.contains(e.target)) {
        seasonDropdown.classList.remove('active');
        document.querySelector('.season-selector-section').classList.remove('dropdown-open');
      }
    });
  }
}

function showList() {
  isInDetailsView = false;
  
  const detailsContainer = document.getElementById("details");
  const mainContainer = document.getElementById("mainContainer");
  const header = document.getElementById("header");
  const bottomNav = document.querySelector('.bottom-nav');
  
  detailsContainer.classList.add('hiding');
  
  setTimeout(() => {
    detailsContainer.style.display = 'none';
    detailsContainer.classList.remove('hiding');
    
    header.classList.remove('hidden');
    mainContainer.classList.remove('hidden');
    bottomNav.style.display = 'flex';
    
    if (currentSearchTerm === '') {
      renderNewReleases();
    }
    
    document.getElementById('search').value = '';
    currentSearchTerm = '';
    renderSeries(allSeries);
  }, 400);
}

// ===================================================
// REPRODUCCIÓN
// ===================================================
async function loadSeriesLinks() {
  try {
    const res = await fetch(SERIES_LINKS_URL);
    seriesLinksData = await res.json();
  } catch (err) {
    console.error('Error al cargar enlaces:', err);
  }
}

async function playEpisode(seriesId, seasonNumber, episodeNumber, title) {
  try {
    const seriesData = seriesLinksData[seriesId];
    
    if (seriesData?.seasons?.[seasonNumber]?.episodes?.[episodeNumber]?.url) {
      const episodeUrl = seriesData.seasons[seasonNumber].episodes[episodeNumber].url;
      
      if (window.AppCreator24?.playVideo) {
        window.AppCreator24.playVideo(episodeUrl, title);
      } else if (window.android?.playVideo) {
        window.android.playVideo(episodeUrl, title);
      } else {
        window.open(episodeUrl, '_blank');
      }
      return;
    }
    
    alert(`No hay enlace disponible para: ${title}`);
  } catch (err) {
    console.error('Error al reproducir:', err);
    alert(`Error al reproducir: ${title}`);
  }
}

// ===================================================
// INICIALIZACIÓN
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  loadSeries();
  loadSeriesLinks();
  
  // Manejar botón atrás
  window.addEventListener('popstate', () => {
    if (isInDetailsView) showList();
  });
  
  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isInDetailsView) showList();
  });
});

// Agregar estilo para spinner y selector de temporadas
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
  }
  
  /* =================================================== */
  /* SELECTOR DE TEMPORADAS PERSONALIZADO */
  /* =================================================== */
  .season-selector-container {
    width: 100%;
    max-width: 100%;
    position: relative;
  }
  
  .season-selector {
    position: relative;
    width: 100%;
  }
  
  .season-selector-toggle {
    background: rgba(255, 255, 255, 0.15);
    color: var(--texto);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    z-index: 100;
    position: relative;
  }
  
  .season-selector-toggle:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .dropdown-arrow {
    transition: transform 0.3s ease;
    font-size: 0.9rem;
    margin-left: 10px;
  }
  
  .season-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    width: 300px;
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.98), rgba(11, 11, 11, 0.98));
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 10px;
    margin-top: 8px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 1001; /* Z-index muy alto para que esté por encima de todo */
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
    max-height: 400px;
    overflow-y: auto;
  }
  
  .season-dropdown.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .season-dropdown.active + .season-selector-toggle .dropdown-arrow {
    transform: rotate(180deg);
  }
  
  .season-option {
    padding: 12px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .season-option.available:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
  
  .season-option.unavailable {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .season-option-text {
    font-size: 0.95rem;
    font-weight: 500;
  }
  
  .no-episodes-badge {
    background: var(--gris-medio);
    color: var(--texto-secundario);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  /* =================================================== */
  /* SECCIÓN DE SELECTOR DE TEMPORADAS (PRIMERO) */
  /* =================================================== */
  .season-selector-section {
    margin: 30px 0;
    padding: 25px;
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.8), rgba(11, 11, 11, 0.9));
    border-radius: 16px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideUp 0.8s ease 0.6s both;
    position: relative;
    z-index: 10;
  }
  
  /* Estilo cuando el dropdown está abierto */
  .season-selector-section.dropdown-open {
    z-index: 1000;
  }
  
  .season-section-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: var(--texto);
    font-weight: 600;
    border-left: 4px solid var(--rojo);
    padding-left: 12px;
  }
  
  /* =================================================== */
  /* CONTENEDOR DE EPISODIOS */
  /* =================================================== */
  .episodes-container {
    display: none;
    margin-top: 20px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
  }
  
  .episodes-container.active {
    opacity: 1;
    transform: translateY(0);
  }
  
  .episodes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    animation: fadeInUp 0.5s ease;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .episode-card {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 20px 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    aspect-ratio: 3/4;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .episode-card:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--rojo);
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(229, 9, 20, 0.3);
  }
  
  .episode-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--rojo), #ff4757);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .episode-card:hover::before {
    opacity: 1;
  }
  
  .episode-number {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--texto);
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--rojo), #ff4757);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .episode-title {
    font-size: 0.85rem;
    color: var(--texto-secundario);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-weight: 500;
  }
  
  .no-episodes-message {
    text-align: center;
    color: var(--texto-secundario);
    padding: 30px;
    font-style: italic;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Asegurar que el contenido de abajo tenga menor z-index */
  .details-extra {
    position: relative;
    z-index: 1;
  }
  
  /* Responsive para el selector de temporadas */
  @media (max-width: 768px) {
    .season-selector-section {
      margin: 25px 0;
      padding: 20px;
    }
    
    .season-section-title {
      font-size: 1.3rem;
      margin-bottom: 15px;
    }
    
    .season-dropdown {
      width: 250px;
      right: 0;
      left: auto;
    }
    
    .episodes-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
    }
    
    .episode-card {
      padding: 15px 10px;
    }
    
    .episode-number {
      font-size: 1.5rem;
    }
    
    .episode-title {
      font-size: 0.8rem;
    }
  }
  
  @media (max-width: 480px) {
    .season-selector-section {
      margin: 20px 0;
      padding: 15px;
    }
    
    .season-section-title {
      font-size: 1.2rem;
    }
    
    .season-dropdown {
      width: 100%;
      right: 0;
      left: 0;
    }
    
    .episodes-grid {
      grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
      gap: 10px;
    }
    
    .episode-card {
      padding: 12px 8px;
    }
    
    .episode-number {
      font-size: 1.3rem;
    }
    
    .episode-title {
      font-size: 0.75rem;
    }
  }
`;
document.head.appendChild(style);

// Recalcular carousels al redimensionar
window.addEventListener('resize', () => {
  if (!isInDetailsView) {
    renderNewReleases();
  }
});