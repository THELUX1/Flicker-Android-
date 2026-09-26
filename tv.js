import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { TIEMPO_RESPUESTA } from "./preguntas.js";

const state = {
  salaId: null,
  ultimaRonda: -1,
  ultimoEstado: null,
  respuestasVistas: new Set(),
  puntajesPrevios: {},
  rondaYaRevelada: false,
  items: new Map()
};

// ===== SONIDOS PUNTUALES =====
const sonidos = {
  risa:        new Audio("sonidos/risa.mp3"),
  aplauso:     new Audio("sonidos/aplauso.mp3"),
  timbre:      new Audio("sonidos/timbre.mp3"),
  tension:     new Audio("sonidos/tension.mp3"),
  correcto:    new Audio("sonidos/correcto.mp3"),
  incorrecto:  new Audio("sonidos/incorrecto.mp3"),
  fanfarria:   new Audio("sonidos/fanfarria.mp3")
};
Object.values(sonidos).forEach(a => a.volume = 0.6);

// ===== MÚSICA DE FONDO =====
const MUSICA = {
  lobby: new Audio("musica/lobby.mp3"),
  juego: new Audio("musica/juego.mp3"),
  final: new Audio("musica/final.mp3")
};
Object.values(MUSICA).forEach(m => {
  m.loop = true;
  m.volume = 0.25;
  m.preload = "auto";
});

let musicaActual = null;
let musicaMuteada = false;
let volumenBase = 0.25;
let duckTimeout = null;

function reproducirMusica(clave) {
  if (musicaActual === clave) return;
  if (musicaActual) {
    MUSICA[musicaActual].pause();
    MUSICA[musicaActual].currentTime = 0;
  }
  musicaActual = clave;
  if (!clave) return;
  const track = MUSICA[clave];
  track.volume = musicaMuteada ? 0 : volumenBase;
  track.play().catch(() => {});
}

function duckMusica(duracionMs = 1800) {
  if (!musicaActual || musicaMuteada) return;
  const track = MUSICA[musicaActual];
  track.volume = Math.max(0, volumenBase * 0.15);
  clearTimeout(duckTimeout);
  duckTimeout = setTimeout(() => {
    track.volume = musicaMuteada ? 0 : volumenBase;
  }, duracionMs);
}

function play(n) {
  const s = sonidos[n];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
  duckMusica(1800);
}

// ===== INDICADOR DE VOLUMEN =====
function inyectarIndicador() {
  if (document.getElementById("tv-vol-indicador")) return;
  const el = document.createElement("div");
  el.id = "tv-vol-indicador";
  el.style.cssText = `
    position: fixed; bottom: 18px; right: 18px;
    padding: 10px 14px;
    background: rgba(0,0,0,.55);
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 12px;
    font-family: inherit; font-size: 14px; font-weight: 700;
    color: #fff; z-index: 200;
    opacity: 0; transition: opacity .3s;
    pointer-events: none; backdrop-filter: blur(8px);
  `;
  document.body.appendChild(el);
}

function mostrarIndicadorVolumen(texto) {
  const el = document.getElementById("tv-vol-indicador");
  if (!el) return;
  el.textContent = texto;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = "0"; }, 1200);
}

// ===== CONTROLES DE TECLADO =====
function configurarControles() {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "+" || k === "=") {
      volumenBase = Math.min(1, volumenBase + 0.05);
      if (musicaActual && !musicaMuteada) MUSICA[musicaActual].volume = volumenBase;
      mostrarIndicadorVolumen(`🔊 ${Math.round(volumenBase * 100)}%`);
    }
    if (k === "-" || k === "_") {
      volumenBase = Math.max(0, volumenBase - 0.05);
      if (musicaActual && !musicaMuteada) MUSICA[musicaActual].volume = volumenBase;
      mostrarIndicadorVolumen(`🔉 ${Math.round(volumenBase * 100)}%`);
    }
    if (k === "m") {
      musicaMuteada = !musicaMuteada;
      if (musicaActual) MUSICA[musicaActual].volume = musicaMuteada ? 0 : volumenBase;
      mostrarIndicadorVolumen(musicaMuteada ? "🔇 Mute" : `🔊 ${Math.round(volumenBase * 100)}%`);
    }
  });
}

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ===== INGRESO =====
const params = new URLSearchParams(location.search);
const salaParam = params.get("sala");
if (salaParam) {
  $("#tv-sala").value = salaParam.toUpperCase();
  setTimeout(() => $("#tv-entrar").click(), 100);
}

$("#tv-entrar").onclick = () => {
  const codigo = $("#tv-sala").value.trim().toUpperCase();
  if (!codigo) return alert("Poné el código");
  state.salaId = codigo;
  $("#tv-ingreso").style.display = "none";
  $("#tv-main").style.display = "flex";
  $("#tv-sala-nombre").textContent = codigo;

  inyectarIndicador();
  configurarControles();
  reproducirMusica("lobby");
  mostrarIndicadorVolumen(`🔊 ${Math.round(volumenBase * 100)}%`);

  conectar();
};

// ===== CONEXIÓN =====
function conectar() {
  onValue(ref(db, `salas/${state.salaId}`), async (snap) => {
    const sala = snap.val();
    if (!sala) return;

    renderRanking(sala);

    if (sala.estado !== state.ultimoEstado) {
      manejarEstado(sala);
      state.ultimoEstado = sala.estado;
    }

    if (sala.estado === "jugando" && sala.preguntaActual !== state.ultimaRonda) {
      state.ultimaRonda = sala.preguntaActual;
      state.respuestasVistas.clear();
      state.rondaYaRevelada = false;
      mostrarPregunta(sala);
      await sleep(400);
      mostrarCartel("🧠", `PREGUNTA ${sala.preguntaActual + 1}`, "¡Respondan!", "amarillo", 2200);
      play("timbre");
      iniciarTensionTimer(sala);
    }

    detectarRespuestas(sala);

    if (sala._revealTick && !state.rondaYaRevelada && sala.estado === "jugando") {
      state.rondaYaRevelada = true;
      revelarEnTV(sala);
    }
  });
}

// ===== RANKING =====
function renderRanking(sala) {
  const jugadores = Object.entries(sala.jugadores || {}).map(([id, j]) => ({ id, ...j }));
  const ordenados = jugadores.sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
  const max = Math.max(1, ...ordenados.map(j => j.puntos || 0));
  const ul = $("#tv-lista-ranking");

  ordenados.forEach((j, i) => {
    let li = state.items.get(j.id);
    if (!li) {
      li = document.createElement("li");
      li.dataset.id = j.id;
      li.className = "rank-item";
      li.innerHTML = `
        <span class="rank-pos"></span>
        <span class="rank-nombre"></span>
        <span class="rank-puntos"></span>
        <div class="rank-bar"><div class="rank-bar-fill"></div></div>
      `;
      state.items.set(j.id, li);
    }

    const antes = state.puntajesPrevios[j.id] ?? j.puntos;
    if (j.puntos > antes) { li.classList.add("subio"); setTimeout(() => li.classList.remove("subio"), 2000); }
    if (j.puntos < antes) { li.classList.add("bajo");  setTimeout(() => li.classList.remove("bajo"),  2000); }
    state.puntajesPrevios[j.id] = j.puntos;

    li.querySelector(".rank-pos").textContent = i + 1;
    li.querySelector(".rank-pos").className = "rank-pos " + (i === 0 ? "oro" : i === 1 ? "plata" : i === 2 ? "bronce" : "");
    li.querySelector(".rank-nombre").textContent = j.nombre;
    li.querySelector(".rank-puntos").textContent = `${j.puntos || 0} pts`;
    li.querySelector(".rank-bar-fill").style.width = `${((j.puntos || 0) / max) * 100}%`;
  });

  const idsActuales = new Set(ordenados.map(j => j.id));
  state.items.forEach((li, id) => {
    if (!idsActuales.has(id)) { li.remove(); state.items.delete(id); }
  });
  ordenados.forEach(j => ul.appendChild(state.items.get(j.id)));
}

// ===== ESTADOS =====
function manejarEstado(sala) {
  if (sala.estado === "lobby") {
    $("#tv-estado").textContent = "🛋️ En el lobby";
    $("#tv-texto-pregunta").textContent = "Esperando que empiece la partida…";
    $("#tv-timer").textContent = "--";
    reproducirMusica("lobby");
  }
  if (sala.estado === "jugando") {
    $("#tv-estado").textContent = "🎮 ¡Jugando!";
    reproducirMusica("juego");
  }
  if (sala.estado === "final") {
    $("#tv-estado").textContent = "🏁 ¡Terminó!";
    reproducirMusica("final");
    mostrarFinalTV(sala);
  }
}

// ===== PREGUNTA =====
function mostrarPregunta(sala) {
  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;
  $("#tv-texto-pregunta").textContent = preg.pregunta;
  $("#tv-ticker-texto").textContent = `📢 Pregunta ${sala.preguntaActual + 1} de ${sala.orden.length}`;
}

// ===== TIMER VISUAL =====
let tvTimerInterval = null;
function iniciarTensionTimer(sala) {
  clearInterval(tvTimerInterval);
  let restante = TIEMPO_RESPUESTA;
  $("#tv-timer").textContent = restante;
  $("#tv-timer").classList.remove("urgente");

  tvTimerInterval = setInterval(() => {
    restante--;
    $("#tv-timer").textContent = Math.max(0, restante);
    if (restante <= 10) {
      $("#tv-timer").classList.add("urgente");
      if (restante === 10) play("tension");
    }
    if (restante <= 0) clearInterval(tvTimerInterval);
  }, 1000);
}

// ===== DETECTAR RESPUESTAS =====
function detectarRespuestas(sala) {
  Object.entries(sala.jugadores || {}).forEach(([id, j]) => {
    if (j.esHost) return;
    const key = `${id}-${sala.preguntaActual}`;
    if (j.respondio === true && !state.respuestasVistas.has(key)) {
      state.respuestasVistas.add(key);
      $("#tv-ticker-texto").textContent = `✍️ ${j.nombre} ya respondió…`;

      const ids = Object.keys(sala.jugadores).filter(i => !sala.jugadores[i].esHost);
      const respondidos = ids.filter(i => sala.jugadores[i].respondio === true).length;
      if (respondidos === ids.length && ids.length > 0) {
        $("#tv-ticker-texto").textContent = `🔥 ¡TODOS RESPONDIERON! Revelando…`;
      }
    }
  });
}

// ===== REVELAR EN TV =====
async function revelarEnTV(sala) {
  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;

  clearInterval(tvTimerInterval);
  $("#tv-timer").textContent = "🎯";

  play("correcto");
  await mostrarCartel("🟢", preg.opciones[preg.correcta], `La respuesta correcta era…`, "verde", 2500);

  if (preg.explicacion) {
    await mostrarCartel("💬", "…", `"${preg.explicacion}"`, "amarillo", 3000);
  }

  const jugadores = Object.entries(sala.jugadores).map(([id, j]) => ({ id, ...j })).filter(j => !j.esHost);
  const aciertos = jugadores.filter(j => j.respuesta === preg.correcta);
  const fallos   = jugadores.filter(j => j.respuesta !== preg.correcta);

  if (aciertos.length > 0) {
    play("aplauso");
    await mostrarCartel("🎉", `¡${aciertos.length} acertaron!`, aciertos.map(j => j.nombre).join(" · "), "verde", 2500);
  }

  if (fallos.length > 0) {
    play("risa");
    await mostrarCartel("😂", `¡${fallos.length} la erraron!`, fallos.map(j => j.nombre).join(" · "), "rojo", 2500);
  }

  // Esperar un poco y releer la sala para tener los puntos ya actualizados
  await sleep(800);

  const salaActualizada = await new Promise((resolve) => {
    const unsub = onValue(ref(db, `salas/${state.salaId}`), (s) => {
      resolve(s.val());
      unsub();
    });
  });

  const mejor = Object.values(salaActualizada.jugadores)
    .filter(j => !j.esHost)
    .sort((a, b) => (b.puntos || 0) - (a.puntos || 0))[0];

  if (mejor && mejor.total > 0) {
    const mem = Math.round((mejor.aciertos / mejor.total) * 100);
    if (mem >= 70) {
      play("aplauso");
      $("#tv-ticker-texto").textContent = `👀 ${mejor.nombre} viene acertando el ${mem}%... ¿sospechoso?`;
    } else if (mem <= 30) {
      play("risa");
      $("#tv-ticker-texto").textContent = `💀 ${mejor.nombre} viene acertando el ${mem}%... ¿amigo o conocido?`;
    }
  }
}

// ===== CARTEL GIGANTE =====
function ajustarTextoCartel(texto) {
  const el = document.getElementById("tv-cartel-texto");
  el.classList.remove("grande", "medio", "chico");
  const len = texto.length;
  if (len <= 8)       el.classList.add("grande");
  else if (len <= 20) el.classList.add("medio");
  else                el.classList.add("chico");
}

async function mostrarCartel(emoji, texto, sub, color, dur) {
  const cartel = $("#tv-cartel");
  $("#tv-cartel-emoji").textContent = emoji;
  const txt = $("#tv-cartel-texto");
  txt.textContent = texto;
  txt.className = "tv-cartel-texto " + (color || "");
  ajustarTextoCartel(texto);
  $("#tv-cartel-sub").textContent = sub || "";
  cartel.classList.add("visible");
  await sleep(dur);
  cartel.classList.remove("visible");
}

// ===== FINAL =====
async function mostrarFinalTV(sala) {
  clearInterval(tvTimerInterval);
  play("fanfarria");
  const jugadores = Object.values(sala.jugadores).filter(j => !j.esHost).sort((a, b) => b.puntos - a.puntos);
  const ganador = jugadores[0];
  if (!ganador) return;

  await mostrarCartel("🏆", `${ganador.nombre} GANA`, `${ganador.puntos} puntos`, "amarillo", 4000);

  for (const j of jugadores) {
    const memoria = j.total ? Math.round((j.aciertos / j.total) * 100) : 0;
    let emoji, frase, color, sonido;

    if (memoria >= 90)      { emoji = "🧠"; frase = "¡WIKIPEDIA HUMANA!";        color = "verde";    sonido = "aplauso"; }
    else if (memoria >= 75) { emoji = "👀"; frase = "Sospechosamente informado"; color = "verde";    sonido = "aplauso"; }
    else if (memoria >= 60) { emoji = "🎯"; frase = "Amigo de confianza";        color = "amarillo"; sonido = "correcto"; }
    else if (memoria >= 40) { emoji = "🥲"; frase = "'Pensé que me conocías'";   color = "amarillo"; sonido = "tension"; }
    else if (memoria >= 20) { emoji = "🎲"; frase = "Le pegaste de casualidad";  color = "rojo";     sonido = "risa"; }
    else                    { emoji = "💀"; frase = "¿Vos sos realmente su amigo?"; color = "rojo";  sonido = "risa"; }

    play(sonido);
    await mostrarCartel(emoji, j.nombre, `${j.puntos} pts · ${memoria}% de memoria · "${frase}"`, color, 3200);
  }

  await mostrarCartel("🎉", "¡GRACIAS POR JUGAR!", "Revuelvan las respuestas 😏", "amarillo", 5000);
}