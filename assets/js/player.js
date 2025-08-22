import { moviesLinks } from './movies-links.js';
import { seriesLinks } from './series-links.js';

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    const season = urlParams.get('season');
    const episode = urlParams.get('episode');

    // Elementos del reproductor
    const video = document.getElementById('main-video');
    const videoContainer = document.getElementById('video-player-container');
    const videoWrapper = document.getElementById('video-wrapper');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const bigPlayBtn = document.getElementById('big-play-btn');
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const qualitySelect = document.getElementById('quality-select');
    const subtitleSelect = document.getElementById('subtitle-select');
    const seasonSelect = document.getElementById('season-select');
    const episodeSelect = document.getElementById('episode-select');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const seriesSelectors = document.getElementById('series-selectors');
    const videoTitle = document.getElementById('video-title');
    const closeBtn = document.getElementById('close-btn');
    const loader = document.getElementById('loader');

    // Variables de estado
    let isFullscreen = false;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let controlsVisible = true;
    let saveInterval;
    let controlsTimeout;
    let lastInteractionTime = 0;
    let isLandscapeMode = window.matchMedia("(orientation: landscape)").matches;

    // Ocultar controles de serie inicialmente
    seriesSelectors.style.display = 'none';

    // Configuración inicial
    if (type === 'movie') {
        setupMoviePlayer(id);
    } else if (type === 'tv') {
        setupSeriesPlayer(id, season, episode);
        seriesSelectors.style.display = 'flex';
    }

    // Eventos del reproductor
    video.addEventListener('click', togglePlayPause);
    video.addEventListener('play', updatePlayButton);
    video.addEventListener('pause', updatePlayButton);
    video.addEventListener('volumechange', updateVolumeIcon);
    video.addEventListener('timeupdate', updateProgressBar);
    video.addEventListener('loadedmetadata', updateDurationDisplay);
    video.addEventListener('ended', videoEnded);
    video.addEventListener('waiting', () => loader.classList.add('active'));
    video.addEventListener('playing', () => loader.classList.remove('active'));
    video.addEventListener('seeking', () => loader.classList.add('active'));
    video.addEventListener('seeked', () => loader.classList.remove('active'));
    
    bigPlayBtn.addEventListener('click', togglePlayPause);
    playPauseBtn.addEventListener('click', togglePlayPause);
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', setVolume);
    progressBar.addEventListener('input', seekVideo);
    progressBar.addEventListener('mousedown', pauseWhileSeeking);
    progressBar.addEventListener('mouseup', playAfterSeeking);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    closeBtn.addEventListener('click', closePlayer);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyPress);
    videoWrapper.addEventListener('mousemove', showControls);
    videoWrapper.addEventListener('touchstart', handleTouch);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Mostrar controles al interactuar
    function showControls() {
        if (!video.paused) {
            videoWrapper.classList.add('show-controls');
            controlsVisible = true;
            lastInteractionTime = Date.now();
            resetControlsTimer();
        }
    }

    function resetControlsTimer() {
    clearTimeout(controlsTimeout);

    controlsTimeout = setTimeout(() => {
        if (Date.now() - lastInteractionTime >= 3000 && !video.paused) {
            hideControls();
        }
    }, 3000);
}

    function hideControls() {
        if (!video.paused && controlsVisible) {
            videoWrapper.classList.remove('show-controls');
            controlsVisible = false;
        }
    }

    let touchStartTime = 0;

    function handleTouch(e) {
        if (e.touches.length === 1) {
            const now = new Date().getTime();
            if (now - touchStartTime < 300) { // Doble toque
                toggleFullscreen();
            } else {
                toggleControls();
            }
            touchStartTime = now;
        }
    }

    function toggleControls() {
        if (controlsVisible) {
            hideControls();
        } else {
            showControls();
        }
    }

    // Funciones del reproductor
    function togglePlayPause() {
        if (video.paused) {
            video.play().catch(e => console.error("Error al reproducir:", e));
        } else {
            video.pause();
        }
        showControls();
    }

    function updatePlayButton() {
        const icon = video.paused ? 'play' : 'pause';
        playPauseBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
        bigPlayBtn.style.display = video.paused ? 'flex' : 'none';
        bigPlayBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
    }

    function videoEnded() {
        bigPlayBtn.style.display = 'flex';
        bigPlayBtn.innerHTML = '<i class="fas fa-redo"></i>';
        // Limpiar progreso guardado
        if (type === 'movie') {
            localStorage.removeItem(`movie_${id}_time`);
        } else if (type === 'tv') {
            localStorage.removeItem(`series_${id}_s${seasonSelect.value}e${episodeSelect.value}_time`);
        }
    }

    function toggleMute() {
        video.muted = !video.muted;
        showControls();
    }

    function updateVolumeIcon() {
        const icon = video.muted || video.volume === 0 ? 'volume-mute' : 
                    video.volume > 0.5 ? 'volume-up' : 'volume-down';
        muteBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
        volumeSlider.value = video.muted ? 0 : video.volume;
    }

    function setVolume() {
        video.volume = volumeSlider.value;
        video.muted = (volumeSlider.value == 0);
        showControls();
    }

    function pauseWhileSeeking() {
        video.dataset.wasPlaying = !video.paused;
        video.pause();
    }

    function playAfterSeeking() {
        if (video.dataset.wasPlaying === 'true') {
            video.play();
        }
        showControls();
    }

    function seekVideo() {
        const seekTime = (progressBar.value / 100) * video.duration;
        video.currentTime = seekTime;
    }

    function updateProgressBar() {
        const value = (video.currentTime / video.duration) * 100;
        progressBar.value = value || 0;
        currentTimeDisplay.textContent = formatTime(video.currentTime);
    }

    function updateDurationDisplay() {
        durationDisplay.textContent = formatTime(video.duration);
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    async function toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                await enterFullscreen();
            } else {
                await exitFullscreen();
            }
            showControls();
        } catch (error) {
            console.error("Error en pantalla completa:", error);
            // Fallback para Safari iOS
            if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
            }
        }
    }

    async function enterFullscreen() {
        const element = videoContainer;
        
        if (element.requestFullscreen) {
            await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            await element.msRequestFullscreen();
        }
        
        // Rotar en móviles
        if (isMobile) {
            try {
                if (screen.orientation?.lock) {
                    await screen.orientation.lock('landscape');
                    isLandscapeMode = true;
                } else {
                    videoWrapper.classList.add('fullscreen-landscape');
                    isLandscapeMode = true;
                }
            } catch (e) {
                console.log("No se pudo bloquear orientación:", e);
                videoWrapper.classList.add('fullscreen-landscape');
                isLandscapeMode = true;
            }
        }
    }

    async function exitFullscreen() {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
        }
        
        // Restaurar orientación en móviles
        if (isMobile) {
            try {
                if (screen.orientation?.unlock) {
                    await screen.orientation.unlock();
                }
            } catch (e) {
                console.log("No se pudo desbloquear orientación:", e);
            }
            videoWrapper.classList.remove('fullscreen-landscape');
            isLandscapeMode = false;
        }
    }

    function handleFullscreenChange() {
        isFullscreen = !!document.fullscreenElement || 
                      !!document.webkitFullscreenElement || 
                      !!document.msFullscreenElement;
        
        fullscreenBtn.classList.toggle('active', isFullscreen);
        fullscreenBtn.innerHTML = isFullscreen ? 
            '<i class="fas fa-compress"></i>' : 
            '<i class="fas fa-expand"></i>';
        
        // Ajustar para móviles
        if (isMobile) {
            videoWrapper.classList.toggle('fullscreen-landscape', isFullscreen);
            isLandscapeMode = isFullscreen;
        }
        
        // Reiniciar controles
        showControls();
    }

    function handleOrientationChange() {
        isLandscapeMode = window.matchMedia("(orientation: landscape)").matches;
        
        if (isFullscreen && isMobile) {
            videoWrapper.classList.toggle('fullscreen-landscape', !isLandscapeMode);
            
            // Reiniciar controles al cambiar orientación
            showControls();
        }
    }

    function handleResize() {
        if (isFullscreen && isMobile) {
            isLandscapeMode = window.innerWidth > window.innerHeight;
            videoWrapper.classList.toggle('fullscreen-landscape', !isLandscapeMode);
        }
    }

    function handleKeyPress(e) {
        switch (e.key) {
            case ' ':
            case 'k':
                togglePlayPause();
                e.preventDefault();
                break;
            case 'm':
                toggleMute();
                e.preventDefault();
                break;
            case 'f':
                toggleFullscreen();
                e.preventDefault();
                break;
            case 'ArrowLeft':
                video.currentTime = Math.max(0, video.currentTime - 5);
                showControls();
                break;
            case 'ArrowRight':
                video.currentTime = Math.min(video.duration, video.currentTime + 5);
                showControls();
                break;
            case 'Escape':
                if (isFullscreen) {
                    exitFullscreen();
                }
                break;
        }
    }

    function closePlayer() {
        clearInterval(saveInterval);
        if (isFullscreen) {
            exitFullscreen();
        }
        window.history.back();
    }

    // Configuración específica para películas
    function setupMoviePlayer(movieId) {
        const movie = moviesLinks[movieId];
        if (!movie) return;

        videoTitle.textContent = movie.title;
        document.title = `Reproduciendo: ${movie.title}`;
        
        // Configurar calidades
        movie.sources.forEach((source, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = source.quality;
            qualitySelect.appendChild(option);
        });
        
        // Configurar subtítulos
        movie.subtitles.forEach((subtitle, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = subtitle.lang;
            subtitleSelect.appendChild(option);
        });
        
        // Restaurar progreso guardado
        const savedTime = localStorage.getItem(`movie_${movieId}_time`);
        if (savedTime) {
            video.addEventListener('loadedmetadata', function() {
                if (video.duration > 0) {
                    video.currentTime = Math.min(parseFloat(savedTime), video.duration * 0.95);
                }
            }, { once: true });
        }
        
        // Guardar progreso cada 5 segundos
        saveInterval = setInterval(() => {
            if (!video.paused && video.currentTime > 0) {
                localStorage.setItem(`movie_${movieId}_time`, video.currentTime.toString());
                localStorage.setItem(`movie_${movieId}_duration`, video.duration.toString());
            }
        }, 5000);
        
        // Cambiar calidad
        qualitySelect.addEventListener('change', function() {
            const selected = movie.sources[this.value];
            video.src = selected.url;
            video.load();
            video.play().catch(e => console.error("Error al reproducir:", e));
            showControls();
        });
        
        // Cambiar subtítulos
        subtitleSelect.addEventListener('change', function() {
            const track = document.getElementById('subtitle-track');
            if (this.value === 'none') {
                track.src = '';
                video.textTracks[0].mode = 'disabled';
            } else {
                const selected = movie.subtitles[this.value];
                track.src = selected.url;
                track.label = selected.lang;
                track.srclang = selected.lang.substring(0, 2).toLowerCase();
                video.textTracks[0].mode = 'showing';
            }
            showControls();
        });
        
        // Cargar primera opción por defecto con autoplay
        if (movie.sources.length > 0) {
            video.src = movie.sources[0].url;
            if (movie.subtitles.length > 0) {
                const track = document.getElementById('subtitle-track');
                track.src = movie.subtitles[0].url;
                track.label = movie.subtitles[0].lang;
                track.srclang = movie.subtitles[0].lang.substring(0, 2).toLowerCase();
            }
            
            video.load();
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Mostrar botón de play si falla el autoplay
                    bigPlayBtn.style.display = 'flex';
                    console.log("Autoplay no permitido:", error);
                });
            }
        }
    }
   // En la función que carga el video, agregar detección de formato
function loadVideo(sourceUrl) {
    const videoElement = document.getElementById('main-video');
    const sourceElement = document.getElementById('video-source');
    const mkvSourceElement = document.getElementById('video-source-mkv') || createMkvSourceElement();
    
    // Determinar el tipo de video basado en la extensión
    const extension = sourceUrl.split('.').pop().toLowerCase();
    
    if (extension === 'mkv') {
        // Para MKV, usar el source específico
        mkvSourceElement.src = sourceUrl;
        mkvSourceElement.type = 'video/x-matroska';
        
        // Asegurarse de que el source MP4 esté vacío
        sourceElement.src = '';
        
        // Cargar el video
        videoElement.load();
    } else {
        // Para otros formatos (mp4, webm, etc.)
        sourceElement.src = sourceUrl;
        sourceElement.type = getVideoType(extension);
        
        // Asegurarse de que el source MKV esté vacío
        if (mkvSourceElement) {
            mkvSourceElement.src = '';
        }
        
        // Cargar el video
        videoElement.load();
    }
}

// Función auxiliar para crear el elemento source MKV si no existe
function createMkvSourceElement() {
    const videoElement = document.getElementById('main-video');
    const mkvSource = document.createElement('source');
    mkvSource.id = 'video-source-mkv';
    videoElement.appendChild(mkvSource);
    return mkvSource;
}

// Función para obtener el tipo MIME correcto
function getVideoType(extension) {
    const types = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mov': 'video/quicktime',
        'mkv': 'video/x-matroska'
    };
    
    return types[extension] || 'video/mp4';
}
    // Configuración específica para series
    function setupSeriesPlayer(seriesId, seasonNum, episodeNum) {
        const series = seriesLinks[seriesId];
        if (!series) return;

        videoTitle.textContent = `${series.title} - Temporada ${seasonNum || 1}`;
        document.title = `Reproduciendo: ${series.title}`;
        
        // Llenar temporadas
        Object.keys(series.seasons).forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.textContent = `T ${season}`;
            seasonSelect.appendChild(option);
        });
        
        // Seleccionar temporada inicial
        const initialSeason = seasonNum || Object.keys(series.seasons)[0];
        seasonSelect.value = initialSeason;
        updateEpisodes(initialSeason);
        
        // Llenar episodios de la temporada seleccionada
        function updateEpisodes(season) {
            episodeSelect.innerHTML = '<option value="">E</option>';
            const episodes = series.seasons[season].episodes;
            
            Object.keys(episodes).forEach(ep => {
                const option = document.createElement('option');
                option.value = ep;
                option.textContent = `E ${ep}`;
                episodeSelect.appendChild(option);
            });
            
            // Seleccionar episodio inicial
            const initialEpisode = episodeNum || Object.keys(episodes)[0];
            episodeSelect.value = initialEpisode;
            loadEpisode(season, initialEpisode);
        }
        
        // Cargar un episodio específico
        function loadEpisode(season, episode) {
            const episodeData = series.seasons[season].episodes[episode];
            videoTitle.textContent = `${series.title} - S${season}E${episode}`;
            
            // Limpiar intervalo anterior
            clearInterval(saveInterval);
            
            // Restaurar progreso guardado
            const savedTime = localStorage.getItem(`series_${seriesId}_s${season}e${episode}_time`);
            if (savedTime) {
                video.addEventListener('loadedmetadata', function() {
                    if (video.duration > 0) {
                        video.currentTime = Math.min(parseFloat(savedTime), video.duration * 0.95);
                    }
                }, { once: true });
            }
            
            // Guardar progreso cada 5 segundos
            saveInterval = setInterval(() => {
                if (!video.paused && video.currentTime > 0) {
                    localStorage.setItem(`series_${seriesId}_s${season}e${episode}_time`, video.currentTime.toString());
                    localStorage.setItem(`series_${seriesId}_s${season}e${episode}_duration`, video.duration.toString());
                }
            }, 5000);
            
            // Actualizar calidades
            qualitySelect.innerHTML = '<option value="">Calidad</option>';
            episodeData.sources.forEach((source, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = source.quality;
                qualitySelect.appendChild(option);
            });
            
            // Actualizar subtítulos
            subtitleSelect.innerHTML = '<option value="none">Subs</option>';
            episodeData.subtitles.forEach((subtitle, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = subtitle.lang;
                subtitleSelect.appendChild(option);
            });
            
            // Cargar primera calidad por defecto con autoplay
            if (episodeData.sources.length > 0) {
                video.src = episodeData.sources[0].url;
                if (episodeData.subtitles.length > 0) {
                    const track = document.getElementById('subtitle-track');
                    track.src = episodeData.subtitles[0].url;
                    track.label = episodeData.subtitles[0].lang;
                    track.srclang = episodeData.subtitles[0].lang.substring(0, 2).toLowerCase();
                }
                
                video.load();
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Mostrar botón de play si falla el autoplay
                        bigPlayBtn.style.display = 'flex';
                        console.log("Autoplay no permitido:", error);
                    });
                }
            }
        }
        
        // Cambiar temporada
        seasonSelect.addEventListener('change', function() {
            updateEpisodes(this.value);
            showControls();
        });
        
        // Cambiar episodio
        episodeSelect.addEventListener('change', function() {
            loadEpisode(seasonSelect.value, this.value);
            showControls();
        });
        
        // Cambiar calidad
        qualitySelect.addEventListener('change', function() {
            const episodeData = series.seasons[seasonSelect.value].episodes[episodeSelect.value];
            video.src = episodeData.sources[this.value].url;
            video.load();
            video.play().catch(e => console.error("Error al reproducir:", e));
            showControls();
        });
        
        // Cambiar subtítulos
        subtitleSelect.addEventListener('change', function() {
            const track = document.getElementById('subtitle-track');
            if (this.value === 'none') {
                track.src = '';
                video.textTracks[0].mode = 'disabled';
            } else {
                const episodeData = series.seasons[seasonSelect.value].episodes[episodeSelect.value];
                const selected = episodeData.subtitles[this.value];
                track.src = selected.url;
                track.label = selected.lang;
                track.srclang = selected.lang.substring(0, 2).toLowerCase();
                video.textTracks[0].mode = 'showing';
            }
            showControls();
        });
    }
});