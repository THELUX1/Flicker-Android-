import { manualMovies, accionMovies, dramaMovies } from './moviesData.js';
document.addEventListener('DOMContentLoaded', function() {
    // Función para obtener todos los géneros únicos
    function getUniqueGenres() {
        // Combinar todos los arrays de películas
        const allMovies = [...manualMovies, ...accionMovies, ...dramaMovies];
        const genresSet = new Set();
        
        // Extraer todos los géneros
        allMovies.forEach(movie => {
            if (movie.genres && Array.isArray(movie.genres)) {
                movie.genres.forEach(genre => {
                    // Limpiar género y asegurar formato consistente
                    const cleanGenre = genre.trim();
                    if (cleanGenre) genresSet.add(cleanGenre);
                });
            }
        });
        
        return Array.from(genresSet).sort((a, b) => a.localeCompare(b));
    }

    // Inicializar el menú de categorías
    function initCategoriesMenu() {
        const dropdown = document.querySelector('.categories-dropdown');
        const button = document.querySelector('.categories-button');
        const menu = document.querySelector('.categories-menu');
        
        if (!dropdown || !button || !menu) return;
        
        // Obtener géneros únicos
        const uniqueGenres = getUniqueGenres();
        
        // Limpiar menú existente
        menu.innerHTML = '';
        
        // Añadir cada género como ítem del menú
        uniqueGenres.forEach(genre => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.textContent = genre;
            item.addEventListener('click', () => {
    const encodedGenre = encodeURIComponent(genre);
    window.location.href = `genero.html?genre=${encodedGenre}`;
            });
            menu.appendChild(item);
        });
        
        // Toggle del menú al hacer clic en el botón
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Cerrar el menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // Inicializar el menú
    initCategoriesMenu();
});