// api.js
const API_KEY = '995449ccaf6d840acc029f95c7d210dd'; // Reemplaza con tu API key
const BASE_URL = 'https://api.themoviedb.org/3';
const YOUTUBE_URL = 'https://www.youtube.com/embed/';

export async function getMediaDetails(type, id) {
    const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=es-MX`);
    return await response.json();
}

export async function getMediaVideos(type, id) {
    const response = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=es-MX`);
    const data = await response.json();
    return data.results.find(video => video.type === 'Trailer') || data.results[0];
}

export async function getSimilarMedia(type, id) {
    const response = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}&language=es-MX&page=1`);
    const data = await response.json();
    return data.results.slice(0, 10); // Limitar a 10 resultados
}