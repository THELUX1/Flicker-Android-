import { db } from "./firebase-config.js";
import {
  ref, set, get, update, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { NIVEL_MULTIPLICADOR } from "./preguntas.js";

const state = {
  miId: crypto.randomUUID(),
  salaId: null,
  nombre: null,
  respuestaActual: null,
  apuestaActual: null,
  preguntaActualIdx: -1,
  rondaEscuchada: -1,
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
    racha: 0, rachaMax: 0, apuesta: null, respuesta: null
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

    // Lista de jugadores en lobby
    renderLobby(sala.jugadores || {});

    // Estado
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
  state.apuestaActual = null;
  state.yaRevelado = false;

  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) {
    // Todavía no hay preguntas cargadas
    return;
  }

  mostrarPantalla("pantalla-juego");
  $("#num-pregunta").textContent = `Pregunta ${sala.preguntaActual + 1}/${sala.orden.length}`;

  // Reset apuesta en este jugador
  await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), {
    apuesta: null, respuesta: null
  });

  // Fase apuesta
  $("#fase-apuesta").style.display = "block";
  $("#fase-pregunta").style.display = "none";
  $("#fase-resultado").style.display = "none";
  $$(".apuesta").forEach(b => b.classList.remove("elegida"));

  // Render pregunta (todavía oculta)
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

  // Reset timer
  clearInterval(state.timerInterval);
  $("#timer").textContent = 20;
}

// ===== APUESTA =====
$$(".apuesta").forEach(btn => {
  btn.onclick = async () => {
    const monto = parseInt(btn.dataset.apuesta);
    state.apuestaActual = monto;
    $$(".apuesta").forEach(b => b.classList.remove("elegida"));
    btn.classList.add("elegida");

    await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), { apuesta: monto });

    $("#fase-apuesta").style.display = "none";
    $("#fase-pregunta").style.display = "block";
    iniciarTimer(20);
  };
});

function iniciarTimer(seg) {
  clearInterval(state.timerInterval);
  let restante = seg;
  $("#timer").textContent = restante;
  state.timerInterval = setInterval(() => {
    restante--;
    $("#timer").textContent = restante;
    if (restante <= 0) clearInterval(state.timerInterval);
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

  await update(ref(db, `salas/${state.salaId}/jugadores/${state.miId}`), { respuesta: indice });
}

// ===== REVELAR RESULTADO =====
async function revelarResultado() {
  if (state.yaRevelado) return;
  state.yaRevelado = true;

  const sala = (await get(ref(db, `salas/${state.salaId}`))).val();
  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;

  const correcta = preg.correcta;
  const updates = {};
  const resultados = [];

  Object.entries(sala.jugadores).forEach(([id, j]) => {
    const acierto = j.respuesta === correcta;
    const apuesta = j.apuesta || 0;
    const mult = NIVEL_MULTIPLICADOR[preg.nivel] || 1;
    const delta = acierto ? Math.round(apuesta * mult) : -apuesta;

    const nuevosPuntos = Math.max(0, (j.puntos || 0) + delta);
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
  $("#fase-apuesta").style.display = "none";
  $("#fase-resultado").style.display = "block";
  $("#respuesta-correcta").innerHTML = `🟢 Respuesta correcta: <strong>${preg.opciones[correcta]}</strong>`;
  $("#explicacion").textContent = preg.explicacion ? `"${preg.explicacion}"` : "";

  $("#resultados-jugadores").innerHTML = resultados
    .sort((a, b) => b.delta - a.delta)
    .map(r => `<li class="${r.acierto ? "acierto" : "fallo"}">
      <span>${r.acierto ? "✅" : "❌"} ${r.nombre}</span>
      <span>${r.delta > 0 ? "+" : ""}${r.delta}</span>
    </li>`).join("");

  // El host avanza solo si nadie lo hace (fallback de seguridad)
  // En este flujo, el host tiene control total.
}

// Escuchar si el host fuerza revelar
onValue(ref(db, `salas/${state.salaId || "x"}/revelar`), () => {});

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
  return "💀 ¿Vos sos realmente su amigo?";
}

// ===== EXPONER FUNCIÓN PARA EL HOST =====
// El host llama a revelar() por Firebase; acá solo escuchamos la señal
onValue(ref(db, `salas/${state.salaId || "x"}/_revealTick`), (snap) => {
  if (!snap.exists()) return;
  if (state.yaRevelado) return;
  if (state.preguntaActualIdx < 0) return;
  revelarResultado();
});

// También revelar cuando se acaba el tiempo local
setInterval(() => {
  const t = parseInt($("#timer").textContent);
  if (!isNaN(t) && t <= 0 && !state.yaRevelado && state.preguntaActualIdx >= 0 && $("#pantalla-juego").classList.contains("activa")) {
    revelarResultado();
  }
}, 500);