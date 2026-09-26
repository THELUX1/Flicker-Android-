import { db } from "./firebase-config.js";
import {
  ref, set, get, update, onValue, push, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { TIEMPO_RESPUESTA } from "./preguntas.js";

// ===== CLAVE DE PERSISTENCIA =====
const STORAGE_KEY = "qcm_jugador_session";

const state = {
  miId: null,
  salaId: null,
  nombre: null,
  respuestaActual: null,
  preguntaActualIdx: -1,
  timerInterval: null,
  yaRevelado: false
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function mostrarPantalla(id) {
  $$(".pantalla").forEach(p => p.classList.remove("activa"));
  $(`#${id}`).classList.add("activa");
}

// ============================================================
// PERSISTENCIA
// ============================================================
function guardarSesion() {
  if (!state.salaId || !state.miId) return;
  const data = {
    salaId: state.salaId,
    miId: state.miId,
    nombre: state.nombre,
    guardadoEn: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("💾 Sesión jugador guardada:", data);
  } catch (e) {
    console.error("❌ Error guardando sesión jugador:", e);
  }
}

function cargarSesion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.salaId || !data.miId) return null;
    // Expiración: 7 días
    if (Date.now() - (data.guardadoEn || 0) > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch (err) {
    console.error("❌ Error leyendo sesión jugador:", err);
    return null;
  }
}

function borrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================
// INGRESO A SALA
// ============================================================
$("#btn-unirse").onclick = async () => {
  const nombre = $("#input-nombre").value.trim();
  const codigo = $("#input-sala").value.trim().toUpperCase();
  if (!nombre || !codigo) return alert("Completá nombre y código");

  const snap = await get(ref(db, `salas/${codigo}`));
  if (!snap.exists()) return alert("Esa sala no existe 😢");

  // Nuevo miId solo al unirse por primera vez
  state.miId = crypto.randomUUID();
  state.salaId = codigo;
  state.nombre = nombre;

  await update(ref(db, `salas/${codigo}/jugadores/${state.miId}`), {
    nombre, puntos: 0, aciertos: 0, total: 0,
    racha: 0, rachaMax: 0,
    respuesta: null, respondio: false, ultimoDelta: 0
  });

  guardarSesion();
  entrarALobby(codigo);
};

// ============================================================
// ENTRAR AL LOBBY
// ============================================================
function entrarALobby(codigo) {
  mostrarPantalla("pantalla-lobby");
  $("#sala-codigo").textContent = codigo;
  conectarSala();
}

// ============================================================
// RECONEXIÓN AUTOMÁTICA
// ============================================================
async function reconectarSala(salaId, miId, nombre) {
  const snap = await get(ref(db, `salas/${salaId}`));
  if (!snap.exists()) {
    console.log("⚠️ La sala ya no existe");
    borrarSesion();
    return false;
  }

  const sala = snap.val();

  // Si ya terminó la partida, no reconectamos
  if (sala.estado === "final") {
    console.log("ℹ️ La sala ya terminó");
    borrarSesion();
    return false;
  }

  state.salaId = salaId;
  state.miId = miId;
  state.nombre = nombre;

  // Verificar que el jugador siga en la sala
  const jugadores = sala.jugadores || {};
  if (!jugadores[miId]) {
    // Ya no está (la sala se recreó o se limpió). Recrear entrada.
    await update(ref(db, `salas/${salaId}/jugadores/${miId}`), {
      nombre, puntos: 0, aciertos: 0, total: 0,
      racha: 0, rachaMax: 0,
      respuesta: null, respondio: false, ultimoDelta: 0
    });
  }

  guardarSesion();
  entrarALobby(salaId);
  console.log("✅ Reconectado a la sala", salaId);
  return true;
}

// ============================================================
// BOTONES DE RECONEXIÓN
// ============================================================
$("#jugador-reconectar").onclick = async () => {
  const sesion = cargarSesion();
  if (!sesion) return;
  await reconectarSala(sesion.salaId, sesion.miId, sesion.nombre);
};

$("#jugador-olvidar").onclick = () => {
  if (!confirm("¿Salir de la sala? Podés volver a entrar con el código.")) return;
  borrarSesion();
  $("#jugador-reconectar-box").style.display = "none";
};

$("#btn-salir-sala").onclick = async () => {
  if (!confirm("¿Salir de la sala? Perdés tu progreso en esta partida.")) return;
  try {
    await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), {
      salio: true
    });
  } catch (e) {}
  borrarSesion();
  location.reload();
};

// ============================================================
// DETECCIÓN DE SESIÓN AL CARGAR
// ============================================================
async function chequearSesionPrevia() {
  console.log("🔍 Buscando sesión de jugador...");

  const sesion = cargarSesion();
  if (!sesion) {
    console.log("ℹ️ No hay sesión guardada");
    return;
  }

  console.log("📦 Sesión encontrada:", sesion);

  try {
    const snap = await get(ref(db, `salas/${sesion.salaId}`));
    if (!snap.exists()) {
      console.log("⚠️ La sala no existe");
      borrarSesion();
      return;
    }

    const sala = snap.val();
    if (sala.estado === "final") {
      console.log("ℹ️ La sala ya terminó");
      borrarSesion();
      return;
    }

    // Mostrar el cartel de reconexión
    $("#jugador-reconectar-box").style.display = "block";
    $("#jugador-reconectar-sala").textContent = sesion.salaId;
    $("#jugador-reconectar-estado").textContent = sala.estado;

    // Rellenar el nombre por si quiere unirse a otra
    $("#input-nombre").value = sesion.nombre || "";

    console.log("🎨 Cartel de reconexión mostrado");
  } catch (err) {
    console.error("❌ Error al chequear sesión:", err);
  }
}

// Ejecutar después de que el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", chequearSesionPrevia);
} else {
  chequearSesionPrevia();
}

// ============================================================
// ESCUCHA DE SALA
// ============================================================
let unsubSala = null;

function conectarSala() {
  if (unsubSala) unsubSala();

  unsubSala = onValue(ref(db, `salas/${state.salaId}`), (snap) => {
    const sala = snap.val();
    if (!sala) return;

    renderLobby(sala.jugadores || {});

    if (sala.estado === "jugando") {
      if (state.preguntaActualIdx !== sala.preguntaActual) {
        entrarARonda(sala);
      }
    } else if (sala.estado === "final") {
      mostrarFinal(sala);
    } else if (sala.estado === "lobby") {
      mostrarPantalla("pantalla-lobby");
    }
  });
}

function renderLobby(jugadores) {
  const lista = Object.entries(jugadores);
  $("#contador-jugadores").textContent = `${lista.length}`;
  $("#lista-jugadores").innerHTML = lista
    .map(([id, j]) => `<li><span>👤 ${j.nombre}</span><span class="listo">${id === state.miId ? "vos" : "listo"}</span></li>`)
    .join("");
}

// ============================================================
// RONDA
// ============================================================
async function entrarARonda(sala) {
  state.preguntaActualIdx = sala.preguntaActual;
  state.respuestaActual = null;
  state.yaRevelado = false;
  state.tiempoInicioRonda = Date.now(); // ⬅️ NUEVO

  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;

  mostrarPantalla("pantalla-juego");
  $("#num-pregunta").textContent = `Pregunta ${sala.preguntaActual + 1}/${sala.orden.length}`;

  await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), {
    respuesta: null, respondio: false
  });

  $("#fase-pregunta").style.display = "block";
  $("#fase-resultado").style.display = "none";

  $("#texto-pregunta").textContent = preg.pregunta;
  const cont = $("#opciones");
  cont.innerHTML = "";
  preg.opciones.forEach((op, i) => {
    const btn = document.createElement("button");
    btn.className = "opcion";
    btn.textContent = `${String.fromCharCode(65 + i)}. ${op}`;
    btn.onclick = () => responder(i);
    cont.appendChild(btn);
  });

  iniciarTimer(TIEMPO_RESPUESTA, () => {
    if (state.respuestaActual === null) responder(-1);
  });
}

// ============================================================
// TIMER
// ============================================================
function iniciarTimer(seg, onEnd) {
  clearInterval(state.timerInterval);
  let restante = seg;
  $("#timer").textContent = restante;

  state.timerInterval = setInterval(() => {
    restante--;
    $("#timer").textContent = Math.max(0, restante);
    if (restante <= 0) {
      clearInterval(state.timerInterval);
      if (onEnd) onEnd();
    }
  }, 1000);
}

// ============================================================
// RESPONDER
// ============================================================
async function responder(indice) {
  if (state.respuestaActual !== null) return;
  state.respuestaActual = indice;

  const tiempoRespuesta = Date.now() - (state.tiempoInicioRonda || Date.now());

  $$(".opcion").forEach((b, i) => {
    b.disabled = true;
    if (i === indice) b.classList.add("elegida");
  });

  await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), {
    respuesta: indice === -1 ? null : indice,
    respondio: true,
    tiempoRespuesta: indice === -1 ? null : tiempoRespuesta // ⬅️ NUEVO
  });

  $("#timer").textContent = "✓";
}

// ============================================================
// REVELAR RESULTADO (solo lectura, ya lo calcula el host)
// ============================================================
async function revelarResultado() {
  if (state.yaRevelado) return;
  state.yaRevelado = true;
  clearInterval(state.timerInterval);

  const sala = (await get(ref(db, `salas/${state.salaId}`))).val();
  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;

  const correcta = preg.correcta;
  const resultados = [];

  Object.entries(sala.jugadores).forEach(([id, j]) => {
    if (j.esHost) return;
    const acierto = j.respuesta === correcta;
    const delta = j.ultimoDelta || 0;
    resultados.push({ nombre: j.nombre, acierto, delta });
  });

  $("#fase-pregunta").style.display = "none";
  $("#fase-resultado").style.display = "block";
  $("#respuesta-correcta").innerHTML = `🟢 Respuesta correcta: <strong>${preg.opciones[correcta]}</strong>`;
  $("#explicacion").textContent = preg.explicacion ? `"${preg.explicacion}"` : "";

  $("#resultados-jugadores").innerHTML = resultados
    .sort((a, b) => b.delta - a.delta)
    .map(r => `<li class="${r.acierto ? "acierto" : "fallo"}">
      <span>${r.acierto ? "✅" : "❌"} ${r.nombre}</span>
      <span>${r.delta > 0 ? "+" : ""}${r.delta}</span>
    </li>`).join("");

  $("#timer").textContent = "🎯";
}

// Escuchar señal de revelado desde el host
onValue(ref(db, `salas/${state.salaId || "_none"}/_revealTick`), (snap) => {
  if (!snap.exists()) return;
  if (state.yaRevelado) return;
  if (state.preguntaActualIdx < 0) return;
  revelarResultado();
});

// ============================================================
// FINAL
// ============================================================
function mostrarFinal(sala) {
  clearInterval(state.timerInterval);
  mostrarPantalla("pantalla-final");
  const jugadores = Object.values(sala.jugadores).sort((a, b) => b.puntos - a.puntos);

  $("#podio").innerHTML = jugadores.map((j, i) => {
    const memoria = j.total ? Math.round((j.aciertos / j.total) * 100) : 0;
    return `<div class="podio-item ${i === 0 ? "primero" : ""}">
      <h4>${i + 1}. ${j.nombre} — ${j.puntos} pts</h4>
      <div class="stats">
        🧠 Memoria: ${memoria}% · 🎯 Aciertos: ${j.aciertos}/${j.total} · 🔥 Racha máx: ${j.rachaMax || 0}
      </div>
      <div class="titulo">${obtenerTitulo(memoria)}</div>
    </div>`;
  }).join("");
}

function obtenerTitulo(memoria) {
  if (memoria >= 90) return "🧠 Wikipedia humana";
  if (memoria >= 75) return "👀 Sospechosamente informado";
  if (memoria >= 60) return "🎯 Amigo de confianza";
  if (memoria >= 40) return "🥲 'Pensé que me conocías'";
  if (memoria >= 20) return "🎲 Le pegaste de casualidad";
  return "💀 ¿Es enserio?";
}
// ============================================================
// CHAT
// ============================================================
async function enviarMensaje() {
  const input = $("#chat-input");
  const texto = input.value.trim();
  if (!texto) return;

  await push(ref(db, `salas/${state.salaId}/_chat`), {
    nombre: state.nombre,
    texto,
    ts: Date.now()
  });

  input.value = "";
}

$("#chat-enviar").onclick = enviarMensaje;
$("#chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    enviarMensaje();
  }
});