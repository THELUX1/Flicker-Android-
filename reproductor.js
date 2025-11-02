import { moviesLinks } from './movies-links.js';
import { moviesData } from './data.js';

// Elementos DOM
const videoPlayer = document.getElementById('video-player');
const videoContainer = document.getElementById('video-container');
const customLoader = document.getElementById('custom-loader');
const customControls = document.getElementById('custom-controls');
const errorOverlay = document.getElementById('error-overlay');
const retryBtn = document.getElementById('retry-btn');
const playerBackBtn = document.getElementById('player-back-btn');
const videoTitle = document.getElementById('video-title');
const qualityBtn = document.getElementById('quality-btn');
const qualityMenu = document.getElementById('quality-menu');
const qualityOptions = document.getElementById('quality-options');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = playPauseBtn.querySelector('.play-icon');
const pauseIcon = playPauseBtn.querySelector('.pause-icon');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progress-bar');
const progressFilled = document.getElementById('progress-filled');
const progressThumb = document.getElementById('progress-thumb');
const volumeBtn = document.getElementById('volume-btn');
const volumeHigh = volumeBtn.querySelector('.volume-high');
const volumeMute = volumeBtn.querySelector('.volume-mute');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const fullscreenEnter = fullscreenBtn.querySelector('.fullscreen-enter');
const fullscreenExit = fullscreenBtn.querySelector('.fullscreen-exit');
const watchingNotification = document.getElementById('watching-notification');
const watchingText = document.getElementById('watching-text');

// Variables de estado
let currentMovieId = null;
let currentSources = [];
let currentQuality = 'HD';
let movieData = null;
let isSeeking = false;
let controlsTimeout = null;
let isFullscreen = false;
let isControlsVisible = false;
let savedProgress = 0;
let hasShownContinueDialog = false;

// Inicializar el reproductor
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    
    if (!movieId) {
        showError('ID de película no especificado');
        return;
    }
    
    // Cargar progreso guardado
    loadSavedProgress(movieId);
    
    loadMovie(movieId);
    setupEventListeners();
    setupVideoEvents();
});

// Cargar progreso guardado desde localStorage
function loadSavedProgress(movieId) {
    const progressData = localStorage.getItem(`movieProgress_${movieId}`);
    if (progressData) {
        const data = JSON.parse(progressData);
        // Solo cargar progreso si la película se vio por más de 30 segundos
        if (data.progress > 30 && data.progress < data.duration - 60) {
            savedProgress = data.progress;
        }
    }
}

// Guardar progreso en localStorage
function saveProgress(movieId, currentTime, duration) {
    const progressData = {
        progress: currentTime,
        duration: duration,
        timestamp: Date.now(),
        movieId: movieId
    };
    localStorage.setItem(`movieProgress_${movieId}`, JSON.stringify(progressData));
}

// Mostrar diálogo para continuar o reiniciar
function showContinueDialog() {
    if (hasShownContinueDialog || savedProgress === 0) return;
    
    const dialog = document.createElement('div');
    dialog.className = 'continue-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-icon">🎬</div>
            <h3>¿Continuar viendo?</h3>
            <p>Tienes progreso guardado de esta película. ¿Quieres continuar desde donde quedaste o empezar de nuevo?</p>
            <div class="dialog-buttons">
                <button class="dialog-btn continue-btn">Continuar</button>
                <button class="dialog-btn restart-btn">Empezar de nuevo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Event listeners para los botones
    dialog.querySelector('.continue-btn').addEventListener('click', () => {
        videoPlayer.currentTime = savedProgress;
        videoPlayer.play();
        dialog.remove();
        hasShownContinueDialog = true;
        showControls();
        resetControlsTimeout();
    });
    
    dialog.querySelector('.restart-btn').addEventListener('click', () => {
        // Limpiar progreso guardado
        localStorage.removeItem(`movieProgress_${currentMovieId}`);
        savedProgress = 0;
        videoPlayer.currentTime = 0;
        videoPlayer.play();
        dialog.remove();
        hasShownContinueDialog = true;
        showControls();
        resetControlsTimeout();
    });
    
    // Mostrar diálogo con animación
    setTimeout(() => {
        dialog.classList.add('show');
    }, 100);
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    playerBackBtn.addEventListener('click', () => {
        if (isFullscreen) {
            exitFullscreen();
        }
        setTimeout(() => {
            window.history.back();
        }, 300);
    });
    
    // Reintentar
    retryBtn.addEventListener('click', () => {
        if (currentMovieId) {
            loadMovie(currentMovieId);
        }
    });
    
    // Calidad
    qualityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = qualityMenu.style.display === 'block';
        qualityMenu.style.display = isVisible ? 'none' : 'block';
        showControls();
        resetControlsTimeout();
    });
    
    // Play/Pause
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
        showControls();
        resetControlsTimeout();
    });
    
    // Volumen
    volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
        showControls();
        resetControlsTimeout();
    });
    
    // Pantalla completa
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
        showControls();
        resetControlsTimeout();
    });
    
    // Barra de progreso
    progressBar.addEventListener('click', (e) => {
        if (!videoPlayer.duration) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoPlayer.currentTime = percent * videoPlayer.duration;
        showControls();
        resetControlsTimeout();
    });
    
    let isDragging = false;
    
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        startSeeking(e);
        showControls();
    });
    
    progressBar.addEventListener('touchstart', (e) => {
        isDragging = true;
        startSeeking(e);
        showControls();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleSeeking(e);
            showControls();
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            handleSeeking(e);
            showControls();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            stopSeeking();
            resetControlsTimeout();
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            stopSeeking();
            resetControlsTimeout();
        }
    });
    
    // Mostrar controles al mover el mouse o tocar
    videoContainer.addEventListener('mousemove', () => {
        if (!videoPlayer.paused) {
            showControls();
            resetControlsTimeout();
        }
    });
    
    videoContainer.addEventListener('touchstart', () => {
        if (!videoPlayer.paused) {
            showControls();
            resetControlsTimeout();
        }
    });
    
    // Toggle play/pause al hacer click en el video
    videoContainer.addEventListener('click', (e) => {
        // Solo toggle play/pause si no se hizo click en un control
        if (!e.target.closest('.control-btn') && 
            !e.target.closest('.quality-menu') && 
            !e.target.closest('.progress-container')) {
            togglePlayPause();
            showControls();
            resetControlsTimeout();
        }
    });
    
    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!qualityBtn.contains(e.target) && !qualityMenu.contains(e.target)) {
            qualityMenu.style.display = 'none';
        }
    });
    
    // Teclado
    document.addEventListener('keydown', handleKeyboard);
    
    // Detectar cambios de pantalla completa
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    // Detectar cambios de orientación sin recargar
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);
}

// Manejar cambio de orientación
function handleOrientationChange() {
    // No recargar el video, solo ajustar la UI si es necesario
    console.log('Orientación cambiada:', screen.orientation?.type);
    // El video sigue reproduciéndose sin interrupciones
}

// Entrar en pantalla completa con rotación horizontal
function enterFullscreen() {
    const element = videoContainer;
    
    // Intentar bloquear orientación horizontal
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(error => {
            console.log('No se pudo bloquear la orientación:', error);
        });
    }
    
    // Entrar en pantalla completa
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(error => {
            console.log('Error al entrar en pantalla completa:', error);
        });
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// Salir de pantalla completa
function exitFullscreen() {
    // Desbloquear orientación
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
    
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Manejar cambios de pantalla completa
function handleFullscreenChange() {
    const wasFullscreen = isFullscreen;
    isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen && !wasFullscreen) {
        // Acaba de entrar en pantalla completa
        fullscreenEnter.style.display = 'none';
        fullscreenExit.style.display = 'block';
        
        // Intentar bloquear orientación cuando entre en pantalla completa
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(error => {
                console.log('No se pudo bloquear la orientación:', error);
            });
        }
    } else if (!isFullscreen && wasFullscreen) {
        // Acaba de salir de pantalla completa
        fullscreenEnter.style.display = 'block';
        fullscreenExit.style.display = 'none';
        
        // Desbloquear orientación al salir de pantalla completa
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
}

// Configurar eventos del video
function setupVideoEvents() {
    videoPlayer.addEventListener('loadstart', () => {
        customLoader.style.display = 'flex';
        errorOverlay.style.display = 'none';
        hideControls();
    });
    
    videoPlayer.addEventListener('loadeddata', () => {
        // El video está cargado, mostrar diálogo si hay progreso guardado
        if (savedProgress > 0 && !hasShownContinueDialog) {
            showContinueDialog();
        }
    });
    
    videoPlayer.addEventListener('canplay', () => {
        customLoader.style.display = 'none';
        updateDuration();
        
        // Mostrar controles temporalmente al cargar
        showControlsTemporarily();
        
        // Si no hay progreso guardado o el usuario eligió no continuar, reproducir desde el inicio
        if (savedProgress === 0 || hasShownContinueDialog) {
            videoPlayer.play().catch(error => {
                console.log('Reproducción automática bloqueada:', error);
                showControls();
            });
        }
    });
    
    videoPlayer.addEventListener('playing', () => {
        videoContainer.classList.add('playing');
        videoContainer.classList.remove('paused');
        hideControlsAfterTimeout();
    });
    
    videoPlayer.addEventListener('pause', () => {
        videoContainer.classList.add('paused');
        videoContainer.classList.remove('playing');
        showControls();
        
        // Guardar progreso al pausar
        if (currentMovieId && videoPlayer.duration) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
    
    videoPlayer.addEventListener('timeupdate', () => {
        updateProgress();
        
        // Guardar progreso cada 10 segundos
        if (currentMovieId && videoPlayer.duration && Math.floor(videoPlayer.currentTime) % 10 === 0) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
    
    videoPlayer.addEventListener('volumechange', updateVolumeIcon);
    
    videoPlayer.addEventListener('waiting', () => {
        customLoader.style.display = 'flex';
        showControls();
    });
    
    videoPlayer.addEventListener('seeking', () => {
        customLoader.style.display = 'flex';
        showControls();
    });
    
    videoPlayer.addEventListener('seeked', () => {
        customLoader.style.display = 'none';
        hideControlsAfterTimeout();
    });
    
    videoPlayer.addEventListener('error', () => {
        customLoader.style.display = 'none';
        errorOverlay.style.display = 'flex';
        showControls();
    });
    
    videoPlayer.addEventListener('ended', () => {
        videoContainer.classList.add('paused');
        videoContainer.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        showControls();
        
        // Limpiar progreso guardado cuando termine la película
        if (currentMovieId) {
            localStorage.removeItem(`movieProgress_${currentMovieId}`);
        }
    });
    
    // Guardar progreso cuando se cierre la página
    window.addEventListener('beforeunload', () => {
        if (currentMovieId && videoPlayer.duration && !videoPlayer.ended) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
    
    // Guardar progreso cuando se cambie de pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && currentMovieId && videoPlayer.duration && !videoPlayer.ended) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
}

// Mostrar controles temporalmente (3 segundos)
function showControlsTemporarily() {
    showControls();
    setTimeout(() => {
        if (!videoPlayer.paused && !isSeeking) {
            hideControls();
        }
    }, 3000);
}

// Mostrar controles
function showControls() {
    if (!isControlsVisible) {
        customControls.style.opacity = '1';
        isControlsVisible = true;
    }
    clearTimeout(controlsTimeout);
}

// Ocultar controles
function hideControls() {
    if (isControlsVisible) {
        customControls.style.opacity = '0';
        isControlsVisible = false;
    }
    clearTimeout(controlsTimeout);
}

// Resetear timeout de controles
function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    if (!videoPlayer.paused && !isSeeking) {
        controlsTimeout = setTimeout(() => {
            if (!videoPlayer.paused && !isSeeking) {
                hideControls();
            }
        }, 3000);
    }
}

// Ocultar controles después de timeout
function hideControlsAfterTimeout() {
    resetControlsTimeout();
}

// Cargar película
function loadMovie(movieId) {
    currentMovieId = movieId;
    
    // Buscar en moviesLinks
    const movieLinks = moviesLinks[movieId];
    
    if (!movieLinks || !movieLinks.sources || movieLinks.sources.length === 0) {
        showError('Película no disponible');
        return;
    }
    
    // Buscar información adicional en moviesData
    movieData = moviesData.find(movie => movie.id.toString() === movieId);
    
    // Actualizar UI
    updateMovieInfo(movieLinks, movieData);
    
    // Mostrar notificación
    showWatchingNotification(movieLinks.title);
    
    // Cargar fuentes de video
    currentSources = movieLinks.sources;
    loadVideoSource();
    
    // Configurar opciones de calidad
    setupQualityOptions();
}

// Actualizar información de la película
function updateMovieInfo(movieLinks, movieData) {
    const title = movieLinks.title || (movieData ? movieData.title : 'Película');
    videoTitle.textContent = title;
}

// Mostrar notificación "Estás viendo"
function showWatchingNotification(title) {
    watchingText.textContent = `Estás viendo ${title}`;
    watchingNotification.classList.remove('hide');
    watchingNotification.classList.add('show');
    
    setTimeout(() => {
        watchingNotification.classList.remove('show');
        watchingNotification.classList.add('hide');
    }, 3000);
}

// Cargar fuente de video
function loadVideoSource() {
    const source = currentSources.find(s => s.quality === currentQuality) || currentSources[0];
    
    if (!source || !source.url) {
        showError('Fuente de video no disponible');
        return;
    }
    
    customLoader.style.display = 'flex';
    errorOverlay.style.display = 'none';
    
    // Configurar el video player
    videoPlayer.innerHTML = '';
    
    const sourceElement = document.createElement('source');
    sourceElement.src = source.url;
    
    // Detectar tipo MIME
    if (source.url.includes('.m3u8')) {
        sourceElement.type = 'application/x-mpegURL';
    } else if (source.url.includes('.mp4')) {
        sourceElement.type = 'video/mp4';
    } else if (source.url.includes('.webm')) {
        sourceElement.type = 'video/webm';
    }
    
    videoPlayer.appendChild(sourceElement);
    videoPlayer.load();
}

// Configurar opciones de calidad
function setupQualityOptions() {
    qualityOptions.innerHTML = '';
    
    currentSources.forEach(source => {
        const button = document.createElement('button');
        button.className = `quality-option ${source.quality === currentQuality ? 'active' : ''}`;
        button.textContent = source.quality;
        button.addEventListener('click', () => {
            changeQuality(source.quality);
        });
        qualityOptions.appendChild(button);
    });
}

// Cambiar calidad
function changeQuality(quality) {
    if (quality === currentQuality) return;
    
    currentQuality = quality;
    loadVideoSource();
    setupQualityOptions();
    qualityMenu.style.display = 'none';
}

// Toggle play/pause
function togglePlayPause() {
    if (videoPlayer.paused || videoPlayer.ended) {
        videoPlayer.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        videoPlayer.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

// Toggle mute
function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    updateVolumeIcon();
}

// Actualizar icono de volumen
function updateVolumeIcon() {
    if (videoPlayer.muted || videoPlayer.volume === 0) {
        volumeHigh.style.display = 'none';
        volumeMute.style.display = 'block';
    } else {
        volumeHigh.style.display = 'block';
        volumeMute.style.display = 'none';
    }
}

// Actualizar duración
function updateDuration() {
    const duration = videoPlayer.duration;
    if (duration) {
        durationEl.textContent = formatTime(duration);
    }
}

// Actualizar progreso
function updateProgress() {
    if (!videoPlayer.duration || isSeeking) return;
    
    const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressFilled.style.width = `${percent}%`;
    progressThumb.style.left = `${percent}%`;
    currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
}

// Formatear tiempo
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Buscar en el video
function startSeeking(e) {
    isSeeking = true;
    handleSeeking(e);
}

function handleSeeking(e) {
    if (!isSeeking || !videoPlayer.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    progressFilled.style.width = `${percent * 100}%`;
    progressThumb.style.left = `${percent * 100}%`;
    currentTimeEl.textContent = formatTime(percent * videoPlayer.duration);
}

function stopSeeking() {
    if (!isSeeking || !videoPlayer.duration) return;
    
    isSeeking = false;
    const percent = parseFloat(progressFilled.style.width) / 100;
    videoPlayer.currentTime = percent * videoPlayer.duration;
}

// Manejar teclado
function handleKeyboard(e) {
    if (!videoPlayer) return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlayPause();
            showControls();
            resetControlsTimeout();
            break;
        case 'f':
            e.preventDefault();
            if (isFullscreen) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
            showControls();
            resetControlsTimeout();
            break;
        case 'm':
            e.preventDefault();
            toggleMute();
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowleft':
            e.preventDefault();
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowright':
            e.preventDefault();
            videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowup':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            updateVolumeIcon();
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowdown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            updateVolumeIcon();
            showControls();
            resetControlsTimeout();
            break;
        case 'escape':
            if (isFullscreen) {
                e.preventDefault();
                exitFullscreen();
            }
            break;
        case 'c':
            e.preventDefault();
            if (isControlsVisible) {
                hideControls();
            } else {
                showControls();
                resetControlsTimeout();
            }
            break;
    }
}

// Mostrar error
function showError(message) {
    customLoader.style.display = 'none';
    errorOverlay.style.display = 'flex';
    console.error('Error en el reproductor:', message);
}