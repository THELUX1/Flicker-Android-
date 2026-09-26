import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { TIEMPO_RESPUESTA } from "./preguntas.js";

console.log("🎬 tv.js cargado");

const state = {
  salaId: null,
  ultimaRonda: -1,
  ultimoEstado: null,
  respuestasVistas: new Set(),
  puntajesPrevios: {},
  rondaYaRevelada: false,
  items: new Map(),
  reaccionesVistas: new Set(),
  chatsVistos: new Set()
};

// ============================================================
// 🎵 MÚSICA — UN SOLO <audio> QUE NUNCA SE TOCA
// ============================================================
const musica = new Audio("musica/juego.mp3");
musica.loop = true;
musica.volume = 0.25;
musica.preload = "auto";

let musicaMuteada = false;
let volumenBase = 0.25;
let musicaIniciada = false;

function iniciarMusica() {
  if (musicaIniciada) return;
  musicaIniciada = true;
  musica.play()
    .then(() => console.log("🎵 Música iniciada"))
    .catch((err) => {
      console.warn("⚠️ Autoplay bloqueado, reintentando en próximo click");
      const reintentar = () => {
        musica.play().catch(() => {});
        document.removeEventListener("click", reintentar);
      };
      document.addEventListener("click", reintentar, { once: true });
    });
}

// ============================================================
// 🔊 EFECTOS CON WEB AUDIO API (no compiten con la música)
// ============================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const buffersSonidos = {};
const nombresSonidos = [
  "risa", "aplauso", "timbre", "tension",
  "correcto", "incorrecto", "fanfarria", "abucheo"
];

// Precargar todos los sonidos como buffers
async function precargarSonidos() {
  const tareas = nombresSonidos.map(async (n) => {
    try {
      const resp = await fetch(`sonidos/${n}.mp3`);
      if (!resp.ok) throw new Error("404");
      const arrayBuffer = await resp.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      buffersSonidos[n] = audioBuffer;
      console.log(`✅ Sonido precargado: ${n}`);
    } catch (e) {
      console.warn(`⚠️ No se pudo precargar: ${n}`);
    }
  });
  await Promise.all(tareas);
}

// Reproducir un sonido desde el buffer (sin límite de simultáneos)
function play(nombre) {
  const buffer = buffersSonidos[nombre];
  if (!buffer) {
    console.warn(`🔇 Sonido no disponible: ${nombre}`);
    return;
  }
  // Desbloquear el audioCtx si hace falta (por política de autoplay)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.6;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(0);
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
      musica.volume = musicaMuteada ? 0 : volumenBase;
      mostrarIndicadorVolumen(`🔊 ${Math.round(volumenBase * 100)}%`);
    }

    if (k === "-" || k === "_") {
      volumenBase = Math.max(0, volumenBase - 0.05);
      musica.volume = musicaMuteada ? 0 : volumenBase;
      mostrarIndicadorVolumen(`🔉 ${Math.round(volumenBase * 100)}%`);
    }

    if (k === "m") {
      musicaMuteada = !musicaMuteada;
      musica.volume = musicaMuteada ? 0 : volumenBase;
      mostrarIndicadorVolumen(musicaMuteada ? "🔇 Mute" : `🔊 ${Math.round(volumenBase * 100)}%`);
    }
  });
}

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pausa = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================================
// CARTELES FLOTANTES
// ============================================================
function mostrarFlotante(emoji, texto, sub, color = "amarillo", duracion = 4500) {
  const cont = document.getElementById("tv-flotantes");
  if (!cont) {
    console.warn("⚠️ #tv-flotantes no existe en el DOM");
    return;
  }

  const el = document.createElement("div");
  el.className = `cartel-flotante ${color}`;
  el.innerHTML = `
    <div class="flotante-emoji">${emoji}</div>
    <div>
      <div class="flotante-texto">${texto}</div>
      ${sub ? `<div class="flotante-sub">${sub}</div>` : ""}
    </div>
  `;
  cont.appendChild(el);

  while (cont.children.length > 5) {
    cont.removeChild(cont.firstChild);
  }

  setTimeout(() => {
    el.classList.add("saliendo");
    setTimeout(() => el.remove(), 400);
  }, duracion);
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
function iniciar() {
  console.log("🚀 Iniciando TV...");

  // Precargar sonidos apenas se abre la TV
  precargarSonidos();

  const params = new URLSearchParams(location.search);
  const salaParam = params.get("sala");

  if (salaParam) {
    console.log("📺 Código recibido por URL:", salaParam);
    const inputSala = $("#tv-sala");
    if (inputSala) inputSala.value = salaParam.toUpperCase();

    setTimeout(() => {
      const btn = $("#tv-entrar");
      if (btn) {
        console.log("🖱️ Simulando click en Conectar...");
        btn.click();
      }
    }, 300);
  }

  const btnEntrar = $("#tv-entrar");
  if (!btnEntrar) {
    console.error("❌ No se encontró #tv-entrar");
    return;
  }

  btnEntrar.onclick = () => {
    const codigo = ($("#tv-sala")?.value || "").trim().toUpperCase();
    if (!codigo) return alert("Poné el código");

    console.log("✅ Conectando a sala:", codigo);
    state.salaId = codigo;

    const ingreso = $("#tv-ingreso");
    const main = $("#tv-main");
    const nombreSala = $("#tv-sala-nombre");

    if (ingreso) ingreso.style.display = "none";
    if (main) main.style.display = "flex";
    if (nombreSala) nombreSala.textContent = codigo;

    inyectarIndicador();
    configurarControles();
    iniciarMusica();
    mostrarIndicadorVolumen(`🔊 ${Math.round(volumenBase * 100)}%`);

    // Desbloquear audioCtx en cuanto haya un click
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    conectar();
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}

// ============================================================
// CONEXIÓN A SALA
// ============================================================
function conectar() {
  console.log("🔌 Conectando a Firebase sala:", state.salaId);

  onValue(ref(db, `salas/${state.salaId}`), async (snap) => {
    const sala = snap.val();
    if (!sala) {
      console.log("⚠️ Sala no encontrada");
      return;
    }

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

  onValue(ref(db, `salas/${state.salaId}/_reacciones`), (snap) => {
    const grupos = snap.val();
    if (!grupos) return;

    Object.entries(grupos).forEach(([key, reacciones]) => {
      if (state.reaccionesVistas.has(key)) return;
      state.reaccionesVistas.add(key);

      const lista = Array.isArray(reacciones) ? reacciones : Object.values(reacciones);

      lista.forEach((r, i) => {
        setTimeout(() => {
          mostrarFlotante(r.emoji, r.texto, r.sub, r.color, 4500);
          if (r.sonido) play(r.sonido);
        }, i * 1200);
      });
    });
  });

  onValue(ref(db, `salas/${state.salaId}/_chat`), (snap) => {
    const mensajes = snap.val();
    if (!mensajes) return;

    Object.entries(mensajes).forEach(([key, msg]) => {
      if (state.chatsVistos.has(key)) return;
      state.chatsVistos.add(key);

      mostrarFlotante("💬", `${msg.nombre}: ${msg.texto}`, "", "chat", 5000);
      play("timbre");
    });
  });
}

// ============================================================
// RANKING
// ============================================================
function renderRanking(sala) {
  const jugadores = Object.entries(sala.jugadores || {}).map(([id, j]) => ({ id, ...j }));
  const ordenados = jugadores.sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
  const max = Math.max(1, ...ordenados.map(j => j.puntos || 0));
  const ul = $("#tv-lista-ranking");
  if (!ul) return;

  ordenados.forEach((j, i) => {
    let li = state.items.get(j.id);
    if (!li) {
      li = document.createElement("li");
      li.dataset.id = j.id;
      li.className = "rank-item";
      li.innerHTML = `
        <span class="rank-pos"></span>
        <span class="rank-avatar"></span>
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

    const avatarEl = li.querySelector(".rank-avatar");
    const urlFoto = j.fotoUrl || "";
    if (avatarEl.dataset.url !== urlFoto) {
      avatarEl.dataset.url = urlFoto;
      avatarEl.innerHTML = urlFoto
        ? `<img src="${urlFoto}" alt="${j.nombre}" />`
        : `<span>👤</span>`;
    }
  });

  const idsActuales = new Set(ordenados.map(j => j.id));
  state.items.forEach((li, id) => {
    if (!idsActuales.has(id)) { li.remove(); state.items.delete(id); }
  });
  ordenados.forEach(j => ul.appendChild(state.items.get(j.id)));
}

// ============================================================
// ESTADOS
// ============================================================
function manejarEstado(sala) {
  if (sala.estado === "lobby") {
    $("#tv-estado").textContent = "🛋️ En el lobby";
    $("#tv-texto-pregunta").textContent = "Esperando que empiece la partida…";
    $("#tv-timer").textContent = "--";
  }
  if (sala.estado === "jugando") {
    $("#tv-estado").textContent = "🎮 ¡Jugando!";
  }
  if (sala.estado === "final") {
    $("#tv-estado").textContent = "🏁 ¡Terminó!";
    mostrarFinalTV(sala);
  }
}

// ============================================================
// PREGUNTA
// ============================================================
function mostrarPregunta(sala) {
  const preg = sala.preguntas?.[sala.orden?.[sala.preguntaActual]];
  if (!preg) return;
  $("#tv-texto-pregunta").textContent = preg.pregunta;
  mostrarFlotante("📢", `Pregunta ${sala.preguntaActual + 1}/${sala.orden.length}`, "", "amarillo", 3500);
}

// ============================================================
// TIMER VISUAL
// ============================================================
let tvTimerInterval = null;
function iniciarTensionTimer(sala) {
  clearInterval(tvTimerInterval);
  let restante = TIEMPO_RESPUESTA;
  const timer = $("#tv-timer");
  if (timer) {
    timer.textContent = restante;
    timer.classList.remove("urgente");
  }

  tvTimerInterval = setInterval(() => {
    restante--;
    if (timer) timer.textContent = Math.max(0, restante);
    if (restante <= 10) {
      if (timer) timer.classList.add("urgente");
      if (restante === 10) play("tension");
    }
    if (restante <= 0) clearInterval(tvTimerInterval);
  }, 1000);
}

// ============================================================
// DETECTAR RESPUESTAS
// ============================================================
function detectarRespuestas(sala) {
  Object.entries(sala.jugadores || {}).forEach(([id, j]) => {
    if (j.esHost) return;
    const key = `${id}-${sala.preguntaActual}`;
    if (j.respondio === true && !state.respuestasVistas.has(key)) {
      state.respuestasVistas.add(key);
      mostrarFlotante("✍️", `${j.nombre} ya respondió`, "", "amarillo", 2500);

      const ids = Object.keys(sala.jugadores).filter(i => !sala.jugadores[i].esHost);
      const respondidos = ids.filter(i => sala.jugadores[i].respondio === true).length;
      if (respondidos === ids.length && ids.length > 0) {
        mostrarFlotante("🔥", "¡TODOS RESPONDIERON!", "Revelando...", "verde", 3000);
      }
    }
  });
}

// ============================================================
// REVELAR EN TV
// ============================================================
async function revelarEnTV(sala) {
  const preg = sala.preguntas?.[sala.orden?.[sala.preguntaActual]];
  if (!preg) return;

  clearInterval(tvTimerInterval);
  const timer = $("#tv-timer");
  if (timer) timer.textContent = "🎯";

  const jugadores = Object.entries(sala.jugadores).map(([id, j]) => ({ id, ...j })).filter(j => !j.esHost);
  const aciertos = jugadores.filter(j => j.respuesta === preg.correcta);
  const fallos   = jugadores.filter(j => j.respuesta !== preg.correcta);

  play("correcto");
  await mostrarCartel("🟢", preg.opciones[preg.correcta], "La respuesta correcta era…", "verde", 3500);

  if (preg.explicacion) {
    await pausa(600);
    await mostrarCartel("💬", "…", `"${preg.explicacion}"`, "amarillo", 4000);
  }

  if (aciertos.length > 0) {
    await pausa(800);
    play("aplauso");
    const texto = aciertos.length === 1 ? `¡${aciertos[0].nombre} acertó!` : `¡${aciertos.length} acertaron!`;
    const nombres = aciertos.map(j => j.nombre).join(" · ");
    await mostrarCartel("🎉", texto, nombres, "verde", 4000);
  }

  if (fallos.length > 0) {
    await pausa(800);
    play("risa");
    const texto = fallos.length === 1 ? `¡${fallos[0].nombre} la erró!` : `¡${fallos.length} la erraron!`;
    const nombres = fallos.map(j => j.nombre).join(" · ");
    await mostrarCartel("😂", texto, nombres, "rojo", 4000);
  }

  await pausa(800);
  await sleep(400);

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
      mostrarFlotante("👀", `${mejor.nombre} viene acertando el ${mem}%`, "¿Sospechoso?", "amarillo", 4500);
    } else if (mem <= 30) {
      play("risa");
      mostrarFlotante("💀", `${mejor.nombre} viene acertando el ${mem}%`, "¿Amigo o conocido?", "rojo", 4500);
    }
  }
}

// ============================================================
// CARTEL GIGANTE
// ============================================================
function ajustarTextoCartel(texto) {
  const el = document.getElementById("tv-cartel-texto");
  if (!el) return;
  el.classList.remove("grande", "medio", "chico");
  const len = texto.length;
  if (len <= 8)       el.classList.add("grande");
  else if (len <= 20) el.classList.add("medio");
  else                el.classList.add("chico");
}

async function mostrarCartel(emoji, texto, sub, color, dur) {
  const cartel = $("#tv-cartel");
  if (!cartel) return;

  if (!document.getElementById("tv-cartel-emoji")) {
    cartel.innerHTML = `
      <div class="tv-cartel-emoji" id="tv-cartel-emoji"></div>
      <div class="tv-cartel-texto" id="tv-cartel-texto"></div>
      <div class="tv-cartel-sub" id="tv-cartel-sub"></div>
    `;
  }

  if (cartel.classList.contains("visible")) {
    cartel.classList.remove("visible");
    await sleep(300);
  }

  document.getElementById("tv-cartel-emoji").textContent = emoji;
  const txt = document.getElementById("tv-cartel-texto");
  txt.textContent = texto;
  txt.className = "tv-cartel-texto " + (color || "");
  ajustarTextoCartel(texto);
  document.getElementById("tv-cartel-sub").textContent = sub || "";

  cartel.classList.add("visible");
  await sleep(dur);
  cartel.classList.remove("visible");
  await sleep(300);
}

// ============================================================
// ESTADÍSTICAS
// ============================================================
async function mostrarEstadisticasTV(sala) {
  const stats = sala._estadisticas || {};
  const lista = Object.values(stats).filter(Boolean);
  if (lista.length === 0) return;

  await mostrarCartel("📊", "ESTADÍSTICAS", "Veamos qué pasó...", "amarillo", 2500);

  const masFacil = [...lista].sort((a, b) => b.porcentajeAciertos - a.porcentajeAciertos)[0];
  if (masFacil) {
    play("aplauso");
    await mostrarCartel("🟢", `${masFacil.porcentajeAciertos}% acertaron`, `LA MÁS FÁCIL: "${masFacil.pregunta}"`, "verde", 5000);
  }

  const masDificil = [...lista].sort((a, b) => a.porcentajeAciertos - b.porcentajeAciertos)[0];
  if (masDificil && masDificil.porcentajeAciertos < masFacil.porcentajeAciertos) {
    play("risa");
    await mostrarCartel("🔴", `${masDificil.porcentajeAciertos}% acertaron`, `LA MÁS DIFÍCIL: "${masDificil.pregunta}"`, "rojo", 5000);
  }

  const unicos = lista.filter(s => s.unicoAcierto);
  if (unicos.length > 0) {
    for (const s of unicos.slice(0, 3)) {
      play("aplauso");
      await mostrarCartel("🏆", `¡Solo ${s.unicoAcierto} acertó!`, `"${s.pregunta}"`, "amarillo", 4500);
    }
  }

  const todosFallaron = lista.filter(s => s.todosFallaron);
  if (todosFallaron.length > 0) {
    play("risa");
    const s = todosFallaron[0];
    const extra = todosFallaron.length > 1 ? ` (y ${todosFallaron.length - 1} más)` : "";
    await mostrarCartel("💀", "¡Nadie la sabía!", `"${s.pregunta}"${extra}`, "rojo", 5000);
  }

  const todosAcertaron = lista.filter(s => s.todosAcertaron);
  if (todosAcertaron.length > 0) {
    play("aplauso");
    const s = todosAcertaron[0];
    const extra = todosAcertaron.length > 1 ? ` (y ${todosAcertaron.length - 1} más)` : "";
    await mostrarCartel("🔥", "¡Todos la sabían!", `"${s.pregunta}"${extra}`, "verde", 5000);
  }

  const promedio = Math.round(lista.reduce((acc, s) => acc + s.porcentajeAciertos, 0) / lista.length);
  await pausa(500);
  await mostrarCartel("📊", `${promedio}% promedio`, `El grupo acertó en promedio ${promedio} de cada 100`, "amarillo", 4500);
}

// ============================================================
// FINAL
// ============================================================
async function mostrarFinalTV(sala) {
  clearInterval(tvTimerInterval);
  play("fanfarria");
  const jugadores = Object.values(sala.jugadores).filter(j => !j.esHost).sort((a, b) => b.puntos - a.puntos);
  const ganador = jugadores[0];
  if (!ganador) return;

  await mostrarCartel("🏆", `${ganador.nombre} GANA`, `${ganador.puntos} puntos`, "amarillo", 6000);
  await pausa(1200);

  for (let i = 0; i < jugadores.length; i++) {
    const j = jugadores[i];
    const memoria = j.total ? Math.round((j.aciertos / j.total) * 100) : 0;
    let emoji, frase, color, sonido;

    if (memoria >= 90)      { emoji = "🧠"; frase = "¡WIKIPEDIA HUMANA!";        color = "verde";    sonido = "aplauso"; }
    else if (memoria >= 75) { emoji = "👀"; frase = "Sospechosamente informado"; color = "verde";    sonido = "aplauso"; }
    else if (memoria >= 60) { emoji = "🎯"; frase = "Amigo de confianza";        color = "amarillo"; sonido = "correcto"; }
    else if (memoria >= 40) { emoji = "🥲"; frase = "'Pensé que me conocías'";   color = "amarillo"; sonido = "tension"; }
    else if (memoria >= 20) { emoji = "🎲"; frase = "Le pegaste de casualidad";  color = "rojo";     sonido = "risa"; }
    else                    { emoji = "💀"; frase = "¿Vos sos realmente su amigo?"; color = "rojo";  sonido = "risa"; }

    play(sonido);

    if (j.fotoUrl) {
      const cartel = $("#tv-cartel");
      const colorBorde = color === "verde" ? "#16a34a" : color === "rojo" ? "#dc2626" : "#facc15";

      cartel.innerHTML = `
        <img src="${j.fotoUrl}" style="
          width: clamp(120px, 18vmin, 200px);
          height: clamp(120px, 18vmin, 200px);
          border-radius: 50%;
          object-fit: cover;
          border: 5px solid ${colorBorde};
          box-shadow: 0 15px 50px rgba(0,0,0,.6);
          margin-bottom: 24px;
        " />
        <div class="tv-cartel-texto ${color}">${j.nombre}</div>
        <div class="tv-cartel-sub">${j.puntos} pts · ${memoria}% de memoria</div>
        <div class="tv-cartel-sub" style="margin-top: 8px; font-style: italic;">"${frase}"</div>
      `;
      cartel.classList.add("visible");
      await sleep(6000);
      cartel.classList.remove("visible");
      await sleep(300);

      cartel.innerHTML = `
        <div class="tv-cartel-emoji" id="tv-cartel-emoji"></div>
        <div class="tv-cartel-texto" id="tv-cartel-texto"></div>
        <div class="tv-cartel-sub" id="tv-cartel-sub"></div>
      `;
    } else {
      await mostrarCartel(emoji, j.nombre, `${j.puntos} pts · ${memoria}% de memoria · "${frase}"`, color, 6000);
    }

    if (i < jugadores.length - 1) await pausa(1000);
  }

  await pausa(1200);
  await mostrarEstadisticasTV(sala);
  await pausa(1200);

  if (sala.ajustes?.mensaje) {
    play("aplauso");
    await mostrarCartel("💬", "Un mensaje...", `"${sala.ajustes.mensaje}"`, "amarillo", 6000);
    await pausa(800);
  }

  await mostrarCartel("🎉", "¡GRACIAS POR JUGAR!", "Revuelvan las respuestas 😏", "amarillo", 7000);
}