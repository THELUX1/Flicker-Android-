import { moviesData, seriesData, featuredContent } from './data.js';

// Elementos DOM
const featuredContainer = document.getElementById('featured-container');
const moviesContainer = document.getElementById('movies-container');
const seriesContainer = document.getElementById('series-container');
const searchModal = document.getElementById('search-modal');
const searchBtn = document.querySelector('.search-btn');
const closeSearch = document.getElementById('close-search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const filterBtns = document.querySelectorAll('.filter-btn');

// API de TMDB
const API_KEY = '995449ccaf6d840acc029f95c7d210dd';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Estado de la aplicación
let currentFilter = 'all';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    renderFeaturedContent();
    renderMovies();
    renderSeries();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Modal de búsqueda
    searchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        searchInput.focus();
    });
    
    closeSearch.addEventListener('click', () => {
        searchModal.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    });
    
    // Búsqueda en tiempo real
    searchInput.addEventListener('input', handleSearch);
    
    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar botones activos
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Actualizar filtro y renderizar
            currentFilter = btn.dataset.filter;
            renderMovies();
        });
    });
    
    // Cerrar modal al hacer clic fuera
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            searchModal.classList.remove('active');
            searchInput.value = '';
            searchResults.innerHTML = '';
        }
    });
}

// Renderizar contenido destacado
function renderFeaturedContent() {
    featuredContainer.innerHTML = '';
    
    featuredContent.forEach(item => {
        const featuredItem = document.createElement('div');
        featuredItem.className = 'featured-item';
        featuredItem.addEventListener('click', () => {
            window.location.href = item.link;
        });
        
        featuredItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="featured-image">
            <div class="featured-info">
                <h3 class="featured-title">${item.title}</h3>
                <p class="featured-year">${item.year}</p>
            </div>
        `;
        
        featuredContainer.appendChild(featuredItem);
    });
}

// Renderizar películas
function renderMovies() {
    moviesContainer.innerHTML = '';
    
    let filteredMovies = moviesData;
    
    // Aplicar filtros
    if (currentFilter === 'new') {
        filteredMovies = moviesData.filter(movie => movie.isNew);
    } else if (currentFilter !== 'all') {
        filteredMovies = moviesData.filter(movie => 
            movie.genres && movie.genres.some(genre => 
                genre.toLowerCase().includes(currentFilter)
            )
        );
    }
    
    filteredMovies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.addEventListener('click', () => {
            window.location.href = movie.link;
        });
        
        movieCard.innerHTML = `
            <div style="position: relative;">
                <img src="${movie.image}" alt="${movie.title}" class="movie-image">
                ${movie.isNew ? '<span class="new-badge">NUEVO</span>' : ''}
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${movie.year}</p>
                ${movie.genres ? `
                    <div class="movie-genres">
                        ${movie.genres.slice(0, 2).map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        moviesContainer.appendChild(movieCard);
    });
}

// Renderizar series
function renderSeries() {
    seriesContainer.innerHTML = '';
    
    seriesData.forEach(series => {
        const seriesCard = document.createElement('div');
        seriesCard.className = 'series-card';
        seriesCard.addEventListener('click', () => {
            window.location.href = series.link;
        });
        
        seriesCard.innerHTML = `
            <img src="${series.image}" alt="${series.title}" class="series-image">
            <div class="series-info">
                <h3 class="series-title">${series.title}</h3>
                <p class="series-year">${series.year}</p>
                ${series.genres ? `
                    <div class="series-genres">
                        ${series.genres.slice(0, 2).map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        seriesContainer.appendChild(seriesCard);
    });
}

// Manejar búsqueda
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }
    
    // Buscar en películas y series
    const allMedia = [...moviesData, ...seriesData];
    const results = allMedia.filter(item => 
        item.title.toLowerCase().includes(query)
    ).slice(0, 10); // Limitar a 10 resultados
    
    renderSearchResults(results);
}

// Renderizar resultados de búsqueda
function renderSearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-secondary);">No se encontraron resultados</p>';
        return;
    }
    
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.addEventListener('click', () => {
            window.location.href = item.link;
        });
        
        resultItem.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="search-result-image">
            <div class="search-result-info">
                <h4 class="search-result-title">${item.title}</h4>
                <p class="search-result-year">${item.year}</p>
            </div>
        `;
        
        searchResults.appendChild(resultItem);
    });
}