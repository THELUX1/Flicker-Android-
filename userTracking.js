import { profileManager } from './profileManager.js';
import { manualMovies, accionMovies, dramaMovies, hiddenMovies } from './moviesData.js';

const DEBUG_MODE = false;
const userTracking = {
    viewedMovies: [],
    likedMovies: [],
    viewedDetails: [],
    watchedGenres: {},
    likedGenres: {},
    favoriteActors: {},
    favoriteDirectors: {},
    watchTime: {},
    lastWatched: [],
    preferencesUpdatedAt: null
};

class UserTracker {
    static init() {
        this.loadFromStorage();
        this.cleanOldData();
    }

    static cleanOldData() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (userTracking.preferencesUpdatedAt && 
            new Date(userTracking.preferencesUpdatedAt) < sixMonthsAgo) {
            this.resetPreferences();
        }
    }

    static resetPreferences() {
        userTracking.watchedGenres = {};
        userTracking.likedGenres = {};
        userTracking.favoriteActors = {};
        userTracking.favoriteDirectors = {};
        userTracking.watchTime = {};
        this.saveToStorage();
    }

    static trackView(movie, watchMinutes = 0) {
        if (!movie || !movie.id) {
            console.error("[UserTracker] Error: Vista sin datos válidos", movie);
            return;
        }
        
        if (!userTracking.viewedMovies.includes(movie.id)) {
            userTracking.viewedMovies.push(movie.id);
            userTracking.lastWatched.unshift(movie.id);
            userTracking.lastWatched = userTracking.lastWatched.slice(0, 10);
            
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    userTracking.watchedGenres[genre] = (userTracking.watchedGenres[genre] || 0) + 1;
                    userTracking.watchTime[genre] = (userTracking.watchTime[genre] || 0) + watchMinutes;
                });
            }
            
            if (movie.cast) {
                movie.cast.forEach(actor => {
                    userTracking.favoriteActors[actor] = (userTracking.favoriteActors[actor] || 0) + 1;
                });
            }
            
            if (movie.directors) {
                movie.directors.forEach(director => {
                    userTracking.favoriteDirectors[director] = (userTracking.favoriteDirectors[director] || 0) + 1;
                });
            }
            
            this.saveToStorage();
            this.refreshRecommendations();
        }
    }
    
    static trackLike(movie) {
        if (!movie || !movie.id) {
            console.error("[UserTracker] Error: 'Me gusta' sin datos válidos", movie);
            return;
        }
        
        if (!userTracking.likedMovies.includes(movie.id)) {
            userTracking.likedMovies.push(movie.id);
            
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    userTracking.likedGenres[genre] = (userTracking.likedGenres[genre] || 0) + 3;
                });
            }
            
            this.saveToStorage();
            this.refreshRecommendations();
        }
    }
    
    static trackDetailView(movie) {
        if (!movie || !movie.id) {
            console.error("[UserTracker] Error: Vista de detalles sin datos válidos", movie);
            return;
        }
        
        if (!userTracking.viewedDetails.includes(movie.id)) {
            userTracking.viewedDetails.push(movie.id);
            
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    userTracking.watchedGenres[genre] = (userTracking.watchedGenres[genre] || 0) + 0.5;
                });
            }
            
            this.saveToStorage();
            this.refreshRecommendations();
        }
    }
    
    static saveToStorage() {
        const currentProfile = profileManager.getCurrentProfile();
        if (currentProfile) {
            userTracking.preferencesUpdatedAt = new Date().toISOString();
            localStorage.setItem(`profile_${currentProfile.id}_tracking`, JSON.stringify(userTracking));
        }
    }
    
    static loadFromStorage() {
        const currentProfile = profileManager.getCurrentProfile();
        if (currentProfile) {
            const savedData = localStorage.getItem(`profile_${currentProfile.id}_tracking`);
            if (savedData) {
                try {
                    Object.assign(userTracking, JSON.parse(savedData));
                } catch (e) {
                    console.error("[UserTracker] Error al cargar datos", e);
                    this.resetPreferences();
                }
            }
        }
    }
    
    static hasSufficientHistory() {
        const viewedCount = userTracking.viewedMovies.length;
        const likedCount = Object.values(userTracking.likedGenres).reduce((a, b) => a + b, 0);
        const detailViews = userTracking.viewedDetails.length;
        return (viewedCount + likedCount + detailViews) >= 3;
    }
    
    static getTopGenres(limit = 3, by = 'watchTime') {
        if (!this.hasSufficientHistory()) return [];
        
        const source = by === 'likes' ? userTracking.likedGenres : 
                      by === 'watchTime' ? userTracking.watchTime : 
                      userTracking.watchedGenres;
        
        return Object.entries(source)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(entry => entry[0]);
    }
    
    static getFavoriteActors(limit = 2) {
        return Object.entries(userTracking.favoriteActors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(entry => entry[0]);
    }
    
    static getFavoriteDirectors(limit = 1) {
        return Object.entries(userTracking.favoriteDirectors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(entry => entry[0]);
    }
    
    static getRecommendedMovies(allMovies, limit = 12) {
        if (!this.hasSufficientHistory()) return [];
        
        const recommendations = [];
        const topGenres = this.getTopGenres(3, 'likes');
        const favoriteActors = this.getFavoriteActors();
        const favoriteDirectors = this.getFavoriteDirectors();
        const currentYear = new Date().getFullYear();
        
        allMovies.forEach(movie => {
            if (!movie || !movie.id || userTracking.viewedMovies.includes(movie.id)) return;
            
            let score = 0;
            let reasons = [];
            
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    if (topGenres.includes(genre)) {
                        score += 15;
                        reasons.push(`Te gusta ${genre}`);
                    }
                    score += (userTracking.likedGenres[genre] || 0) * 2;
                    score += (userTracking.watchedGenres[genre] || 0);
                });
            }
            
            if (movie.cast) {
                movie.cast.forEach(actor => {
                    if (favoriteActors.includes(actor)) {
                        score += 20;
                        reasons.push(`Con ${actor}`);
                    }
                });
            }
            
            if (movie.directors) {
                movie.directors.forEach(director => {
                    if (favoriteDirectors.includes(director)) {
                        score += 30;
                        reasons.push(`Dirigida por ${director}`);
                    }
                });
            }
            
            if (movie.year && (movie.year == currentYear || movie.year == currentYear - 1)) {
                const hasFavoriteGenre = movie.genres?.some(g => topGenres.includes(g));
                if (hasFavoriteGenre) {
                    score += 10;
                    reasons.push("Novedad en tus géneros favoritos");
                }
            }
            
            const lastWatchedGenres = userTracking.lastWatched.flatMap(id => {
                const m = allMovies.find(m => m.id == id);
                return m?.genres || [];
            });
            
            const commonGenres = movie.genres?.filter(g => lastWatchedGenres.includes(g));
            if (commonGenres?.length > 0) {
                score += 5 * commonGenres.length;
                reasons.push(`a tus recientes vistas`);
            }
            
            if (score > 0) {
                recommendations.push({
                    ...movie,
                    recommendationScore: score,
                    reasons: [...new Set(reasons)]
                });
            }
        });
        
        return recommendations
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);
    }
    
    static refreshRecommendations() {
        this.saveToStorage();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('recommendationsUpdated'));
        }
    }
    
    static getTrackingData() {
        return {
            ...userTracking,
            hasSufficientHistory: this.hasSufficientHistory(),
            topGenres: this.getTopGenres(),
            favoriteActors: this.getFavoriteActors(),
            favoriteDirectors: this.getFavoriteDirectors()
        };
    }
}

UserTracker.init();

export default UserTracker;