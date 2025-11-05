const DATA_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/refs/heads/main/data.json";
const TMDB_API_KEY = "995449ccaf6d840acc029f95c7d210dd";
const MOVIES_LINKS_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/refs/heads/main/movies-links.json";

let allMovies = [];
let currentSearchTerm = '';
let moviesLinksData = {};
let isInDetailsView = false;

// Función para alternar la visibilidad del buscador
function toggleSearch() {
  const searchContainer = document.getElementById('searchContainer');
  searchContainer.classList.toggle('active');
  
  if (searchContainer.classList.contains('active')) {
    setTimeout(() => {
      document.getElementById('search').focus();
    }, 100);
  }
}

// Cerrar buscador al hacer clic fuera
document.addEventListener('click', (e) => {
  const searchContainer = document.getElementById('searchContainer');
  const searchToggle = document.querySelector('.search-toggle');
  
  if (!searchContainer.contains(e.target) && !searchToggle.contains(e.target)) {
    searchContainer.classList.remove('active');
  }
});

// ===================================================
// 🔙 SISTEMA DE BOTÓN ATRÁS CORREGIDO
// ===================================================
function initializeBackButton() {
  // Manejar el botón de atrás del navegador
  window.addEventListener('popstate', function (event) {
    if (isInDetailsView) {
      showList();
    }
  });

  // Manejar el botón de atrás físico en Android
  document.addEventListener('backbutton', handleBackButton, false);

  // Manejar tecla Escape en desktop
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isInDetailsView) {
      showList();
    }
  });
}

function handleBackButton(event) {
  if (event) event.preventDefault();

  if (isInDetailsView) {
    showList();
  } else {
    // Confirmar salida de la app
    if (confirm("¿Deseas salir de Flicker?")) {
      if (navigator.app && navigator.app.exitApp) {
        navigator.app.exitApp();
      } else {
        window.close();
      }
    }
  }

  return false;
}

// ===================================================
// CARGA DE PELÍCULAS
// ===================================================
async function loadMovies() {
  try {
    document.getElementById("movies").innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
        <div class="loading" style="font-size: 1.5rem;">Cargando películas...</div>
      </div>
    `;
    
    const res = await fetch(DATA_URL);
    const data = await res.json();
    allMovies = data.moviesData || data;
    renderMovies(allMovies);
    updateMoviesCount(allMovies.length);
  } catch (err) {
    console.error('Error al cargar películas:', err);
    document.getElementById("movies").innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
        <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar películas</p>
        <p style="font-size: 1rem;">Intenta recargar la página o verifica tu conexión</p>
        <button onclick="loadMovies()" style="margin-top: 20px; padding: 12px 24px; background: var(--rojo); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 1rem;">
          Reintentar
        </button>
      </div>
    `;
  }
}

function updateMoviesCount(count) {
  document.getElementById('moviesCount').textContent = `${count} ${count === 1 ? 'película disponible' : 'películas disponibles'}`;
}

function renderMovies(movies) {
  const grid = document.getElementById("movies");
  grid.innerHTML = "";
  
  if (!movies.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
        <p style="font-size: 1.3rem; margin-bottom: 15px;">🎬 No se encontraron películas</p>
        <p style="font-size: 1rem;">Intenta con otros términos de búsqueda</p>
      </div>
    `;
    updateMoviesCount(0);
    return;
  }

  movies.forEach((movie, index) => {
    const movieCard = document.createElement("div");
    movieCard.className = "movie-card";
    movieCard.style.animationDelay = `${(index % 8) * 0.05}s`;
    
    const genres = movie.genres || [];
    const genresToShow = genres.slice(0, 2);
    const remainingGenres = genres.length > 2 ? genres.length - 2 : 0;
    
    movieCard.innerHTML = `
      ${movie.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
      <img src="${movie.image}" alt="${movie.title}" class="movie-poster" 
           onerror="this.src='https://via.placeholder.com/300x450/2d2d2d/ffffff?text=Imagen+No+Disponible'"
           loading="lazy">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-year">${movie.year}</div>
        <div class="movie-genres">
          ${genresToShow.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
          ${remainingGenres > 0 ? `<span class="genre-tag">+${remainingGenres}</span>` : ''}
        </div>
      </div>
    `;
    movieCard.onclick = () => showDetails(movie);
    grid.appendChild(movieCard);
  });

  updateMoviesCount(movies.length);
}

// ===================================================
// DETALLES DE PELÍCULA CON ANIMACIONES
// ===================================================
async function showDetails(movie) {
  isInDetailsView = true;
  history.pushState({ page: 'details', movieId: movie.id }, '', `#${movie.id}`);
  
  // Animación de salida del catálogo
  document.getElementById("mainContainer").classList.add("hidden");
  document.getElementById("header").classList.add("hidden");
  
  // Esperar a que termine la animación de salida antes de mostrar detalles
  setTimeout(() => {
    document.getElementById("details").style.display = "block";
    
    document.getElementById("details-content").innerHTML = `
      <div style="text-align: center; padding: 100px; color: var(--texto-secundario);">
        <div class="loading" style="font-size: 1.5rem;">Cargando detalles...</div>
      </div>
    `;

    loadMovieDetails(movie);
  }, 400); // Tiempo que coincide con la duración de la animación
}

async function loadMovieDetails(movie) {
  try {
    const [movieRes, trailerRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=es-ES`),
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=es-ES`)
    ]);

    const data = await movieRes.json();
    const trailerData = await trailerRes.json();
    const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");

    document.getElementById("details-content").innerHTML = `
      <!-- Botón de volver móvil (se muestra solo en móviles) -->
      
      
      <div class="details-hero" style="background-image: url('${movie.image}')">
        <div class="details-content">
          <div class="details-info">
            <h1 class="details-title">${movie.title}</h1>
            <div class="details-meta">
              <span class="details-year">${movie.year}</span>
              <div class="details-genres">
                ${(movie.genres || []).map(genre => `<span class="details-genre">${genre}</span>`).join('')}
              </div>
            </div>
            <p class="details-overview">${data.overview || "Sin descripción disponible."}</p>
            <button class="play-btn" onclick="playMovieWithOptions(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
              <span>▶</span> Ver ahora
            </button>
          </div>
        </div>
      </div>
      <div class="trailer-container">
        <div class="trailer-content">
          <h3 class="trailer-title">Tráiler</h3>
          ${trailer ?
            `<iframe class="trailer-frame" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>` :
            '<div class="no-trailer">🎬 Tráiler no disponible</div>'
          }
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar detalles:', err);
    document.getElementById("details-content").innerHTML = `
      <div style="text-align: center; padding: 80px; color: var(--texto-secundario);">
        <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar detalles</p>
        <p style="font-size: 1rem;">Intenta nuevamente más tarde</p>
        <button class="back-button" onclick="showList()" style="margin-top: 20px;">
          <span>←</span> Volver al catálogo
        </button>
      </div>
    `;
  }
}

// ===================================================
// VOLVER AL CATÁLOGO CON ANIMACIONES
// ===================================================
function showList() {
  isInDetailsView = false;

  // Animación de salida de detalles
  const detailsContainer = document.getElementById("details");
  detailsContainer.classList.add("hiding");

  // Esperar a que termine la animación de salida antes de mostrar el catálogo
  setTimeout(() => {
    // Reiniciar historial para evitar cierre accidental
    history.pushState({ page: 'list' }, '', '#');

    detailsContainer.style.display = "none";
    detailsContainer.classList.remove("hiding");

    document.getElementById("header").classList.remove("hidden");
    document.getElementById("mainContainer").classList.remove("hidden");

    document.getElementById('search').value = '';
    currentSearchTerm = '';
    renderMovies(allMovies);
  }, 400); // Tiempo que coincide con la duración de la animación
}

// ===================================================
// REPRODUCCIÓN Y DATOS
// ===================================================
async function loadMoviesLinks() {
  try {
    const res = await fetch(MOVIES_LINKS_URL);
    moviesLinksData = await res.json();
    console.log('Enlaces de películas cargados correctamente');
  } catch (err) {
    console.error('Error al cargar enlaces de películas:', err);
  }
}

async function playMovieWithOptions(id, title) {
  try {
    const movieData = moviesLinksData[id];
    
    if (movieData && movieData.sources && movieData.sources.length > 0) {
      const availableSource = movieData.sources.find(source => source.url) || movieData.sources[0];
      
      if (availableSource && availableSource.url) {
        if (window.AppCreator24 && window.AppCreator24.playVideo) {
          window.AppCreator24.playVideo(availableSource.url, title);
        } else if (window.android && window.android.playVideo) {
          window.android.playVideo(availableSource.url, title);
        } else {
          window.open(availableSource.url, '_blank');
        }
      } else {
        alert(`No hay enlace disponible para: ${title}`);
      }
    } else {
      alert(`No se encontraron enlaces para: ${title}`);
    }
  } catch (err) {
    console.error('Error al reproducir película:', err);
    alert(`Error al reproducir: ${title}`);
  }
}

// ===================================================
// INICIALIZACIÓN
// ===================================================
window.addEventListener('load', function () {
  initializeBackButton();

  if (window.location.hash) {
    history.replaceState({ page: 'list' }, '', '#');
  } else {
    history.replaceState({ page: 'list' }, '', '');
  }

  loadMovies();
  loadMoviesLinks();
});

// Buscador dinámico
document.getElementById("search").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase().trim();
  currentSearchTerm = term;
  const filtered = allMovies.filter(m =>
    m.title?.toLowerCase().includes(term) ||
    (m.genres || []).some(genre => genre.toLowerCase().includes(term)) ||
    m.year?.includes(term)
  );
  renderMovies(filtered);
});

// Reset al cerrar
window.addEventListener('beforeunload', function () {
  isInDetailsView = false;
});