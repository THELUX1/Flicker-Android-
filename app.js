import { db } from "./firebase-config.js";
import {
  ref, set, get, update, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  TIEMPO_RESPUESTA,
  PUNTOS_POR_ACIERTO
} from "./preguntas.js";

const state = {
  miId: crypto.randomUUID(),
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

// ===== INGRESO =====
$("#btn-unirse").onclick = async () => {
  const nombre = $("#input-nombre").value.trim();
  const codigo = $("#input-sala").value.trim().toUpperCase();
  if (!nombre || !codigo) return alert("Completá nombre y código");

  const snap = await get(ref(db, `salas/${codigo}`));
  if (!snap.exists()) return alert("Esa sala no existe 😢");

  state.salaId = codigo;
  state.nombre = nombre;

  await update(ref(db, `salas/${codigo}/jugadores/${state.miId}`), {
    nombre, puntos: 0, aciertos: 0, total: 0,
    racha: 0, rachaMax: 0,
    respuesta: null, respondio: false
  });

  mostrarPantalla("pantalla-lobby");
  $("#sala-codigo").textContent = codigo;
  conectarSala();
};

// ===== ESCUCHA DE SALA =====
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

// ===== RONDA =====
async function entrarARonda(sala) {
  state.preguntaActualIdx = sala.preguntaActual;
  state.respuestaActual = null;
  state.yaRevelado = false;

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
    if (state.respuestaActual === null) {
      responder(-1);
    }
  });
}

// ===== TIMER =====
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

// ===== RESPONDER =====
async function responder(indice) {
  if (state.respuestaActual !== null) return;
  state.respuestaActual = indice;

  $$(".opcion").forEach((b, i) => {
    b.disabled = true;
    if (i === indice) b.classList.add("elegida");
  });

  await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), {
    respuesta: indice === -1 ? null : indice,
    respondio: true
  });

  $("#timer").textContent = "✓";
}

// ===== REVELAR RESULTADO =====
async function revelarResultado() {
  if (state.yaRevelado) return;
  state.yaRevelado = true;
  clearInterval(state.timerInterval);

  const sala = (await get(ref(db, `salas/${state.salaId}`))).val();
  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;

  const correcta = preg.correcta;
  const updates = {};
  const resultados = [];

  Object.entries(sala.jugadores).forEach(([id, j]) => {
    const acierto = j.respuesta === correcta;
    const delta = acierto ? PUNTOS_POR_ACIERTO : 0;

    const nuevosPuntos = (j.puntos || 0) + delta;
    const nuevaRacha = acierto ? (j.racha || 0) + 1 : 0;

    updates[`salas/${state.salaId}/jugadores/${id}/puntos`]   = nuevosPuntos;
    updates[`salas/${state.salaId}/jugadores/${id}/aciertos`] = (j.aciertos || 0) + (acierto ? 1 : 0);
    updates[`salas/${state.salaId}/jugadores/${id}/total`]    = (j.total || 0) + 1;
    updates[`salas/${state.salaId}/jugadores/${id}/racha`]    = nuevaRacha;
    updates[`salas/${state.salaId}/jugadores/${id}/rachaMax`] = Math.max(j.rachaMax || 0, nuevaRacha);

    resultados.push({ nombre: j.nombre, acierto, delta });
  });

  await update(ref(db), updates);

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

// ===== FINAL =====
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
  return "💀 ¿Vos sos realmente amigo?";
}