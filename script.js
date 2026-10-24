/* ============================================================
   Control de Gastos - Panel financiero
   Login por correo, menú por permisos y flujo de caja
   ============================================================ */

const STORAGE_KEY = "controlGastosDatos_v3";
const SESSION_KEY = "controlGastosSesion_v1";

const SECCIONES = {
  dashboard: { eyebrow: "Panel general", titulo: "Resumen financiero" },
  registro: { eyebrow: "Captura rápida", titulo: "Registrar gasto" },
  historial: { eyebrow: "Consulta", titulo: "Historial de gastos" },
  movimientos: { eyebrow: "Flujo de dinero", titulo: "Ingresos y gastos fijos" },
  metas: { eyebrow: "Proyectos a futuro", titulo: "Metas de ahorro" },
  tablas: { eyebrow: "Base de datos", titulo: "Estructura de hojas" }
};

const MENU_DEFAULT = [
  { id: "MENU_DASHBOARD", etiqueta: "Panel general", seccion: "dashboard", usuarios: "TODOS", orden: 1, activa: true },
  { id: "MENU_REGISTRO", etiqueta: "Registrar gasto", seccion: "registro", usuarios: "TODOS", orden: 2, activa: true },
  { id: "MENU_HISTORIAL", etiqueta: "Historial", seccion: "historial", usuarios: "TODOS", orden: 3, activa: true },
  { id: "MENU_MOVIMIENTOS", etiqueta: "Ingresos y gastos fijos", seccion: "movimientos", usuarios: "TODOS", orden: 4, activa: true },
  { id: "MENU_METAS", etiqueta: "Metas de ahorro", seccion: "metas", usuarios: "TODOS", orden: 5, activa: true }
];

const categoriasBase = [
  { id: "CAT001", nombre: "Alimentacion", icono: "restaurant", activa: true },
  { id: "CAT002", nombre: "Servicios", icono: "bolt", activa: true },
  { id: "CAT003", nombre: "Ocio", icono: "mood", activa: true },
  { id: "CAT004", nombre: "Transporte", icono: "directions_car", activa: true },
  { id: "CAT005", nombre: "Salud", icono: "favorite", activa: true }
];

/* ---------- Persistencia local ---------- */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("No se pudo guardar en localStorage:", error);
  }
}

let session = loadJSON(SESSION_KEY, null);
let appData = loadJSON(STORAGE_KEY, { users: {} });
if (!appData.users) appData.users = {};

let menuItems = MENU_DEFAULT.slice();

function saveData() {
  saveJSON(STORAGE_KEY, appData);
}

function userData(userId) {
  if (!appData.users[userId]) {
    appData.users[userId] = { categorias: [], gastos: [], ingresos: [], pagos: [], metas: [] };
  }
  return appData.users[userId];
}

function currentUserData() {
  return session ? userData(session.id) : null;
}

const state = {
  get categorias() { const d = currentUserData(); return d ? d.categorias : []; },
  set categorias(v) { const d = currentUserData(); if (d) { d.categorias = v; saveData(); } },
  get gastos() { const d = currentUserData(); return d ? d.gastos : []; },
  set gastos(v) { const d = currentUserData(); if (d) { d.gastos = v; saveData(); } },
  get ingresos() { const d = currentUserData(); return d ? d.ingresos : []; },
  set ingresos(v) { const d = currentUserData(); if (d) { d.ingresos = v; saveData(); } },
  get pagos() { const d = currentUserData(); return d ? d.pagos : []; },
  set pagos(v) { const d = currentUserData(); if (d) { d.pagos = v; saveData(); } },
  get metas() { const d = currentUserData(); return d ? d.metas : []; },
  set metas(v) { const d = currentUserData(); if (d) { d.metas = v; saveData(); } }
};

/* ---------- Referencias del DOM ---------- */

const elements = {
  loginScreen: document.getElementById("loginScreen"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginButton: document.getElementById("loginButton"),
  loginMessage: document.getElementById("loginMessage"),
  appShell: document.getElementById("appShell"),

  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  menuToggle: document.getElementById("menuToggle"),
  navLinks: document.getElementById("navLinks"),
  sidebarAvatar: document.getElementById("sidebarAvatar"),
  sidebarUserName: document.getElementById("sidebarUserName"),
  sidebarUserMail: document.getElementById("sidebarUserMail"),
  logoutButton: document.getElementById("logoutButton"),

  currentSectionEyebrow: document.getElementById("currentSectionEyebrow"),
  currentSectionTitle: document.getElementById("currentSectionTitle"),
  connectionStatus: document.getElementById("connectionStatus"),
  topbarUserPill: document.getElementById("topbarUserPill"),
  quickExpenseButton: document.getElementById("quickExpenseButton"),

  categoriaSelect: document.getElementById("categoriaSelect"),
  categoriasList: document.getElementById("categoriasList"),
  historialTable: document.getElementById("historialTable"),
  categoriaChart: document.getElementById("categoriaChart"),
  ultimosGastos: document.getElementById("ultimosGastos"),
  historySearch: document.getElementById("historySearch"),

  expenseForm: document.getElementById("expenseForm"),
  categoryForm: document.getElementById("categoryForm"),
  metaForm: document.getElementById("metaForm"),
  ingresoForm: document.getElementById("ingresoForm"),
  pagoForm: document.getElementById("pagoForm"),

  formMessage: document.getElementById("formMessage"),
  categoryMessage: document.getElementById("categoryMessage"),
  metaFormMessage: document.getElementById("metaFormMessage"),
  ingresoMessage: document.getElementById("ingresoMessage"),
  pagoMessage: document.getElementById("pagoMessage"),

  fechaInput: document.getElementById("fechaInput"),
  ingresoFechaInput: document.getElementById("ingresoFechaInput"),
  guardarButton: document.getElementById("guardarButton"),
  guardarCategoriaButton: document.getElementById("guardarCategoriaButton"),
  guardarMetaButton: document.getElementById("guardarMetaButton"),
  guardarIngresoButton: document.getElementById("guardarIngresoButton"),
  guardarPagoButton: document.getElementById("guardarPagoButton"),

  pagosGrid: document.getElementById("pagosGrid"),
  metasGrid: document.getElementById("metasGrid"),
  ingresosTable: document.getElementById("ingresosTable"),
  pagoCategoriaInput: document.getElementById("pagoCategoriaInput"),

  movimientosTabs: document.getElementById("movimientosTabs")
};

/* ---------- Utilidades ---------- */

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isCurrentMonth(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function isCurrentFortnight(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  if (!isCurrentMonth(dateString)) return false;
  const currentDay = now.getDate();
  const expenseDay = date.getDate();
  return currentDay <= 15 ? expenseDay <= 15 : expenseDay > 15;
}

function daysBetween(from, to) {
  return Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
}

function initialsFromName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "--";
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + second).toUpperCase();
}

function avatarVariant(userId) {
  const seed = String(userId || "");
  let total = 0;
  for (let i = 0; i < seed.length; i++) total += seed.charCodeAt(i);
  return `user-avatar--c${(total % 4) + 1}`;
}

function slugifyCategoryName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function slugifyMetaCategoria(value) {
  const map = {
    "Viajes": "viajes",
    "Tecnología": "tecnologia",
    "Tecnologia": "tecnologia",
    "Educación": "educacion",
    "Educacion": "educacion",
    "Vivienda": "vivienda",
    "Vehículo": "vehiculo",
    "Vehiculo": "vehiculo",
    "Salud": "salud",
    "Otros": "otros"
  };
  return map[value] || "otros";
}

function isFacturaUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getMonthLabel(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleString("es-ES", { month: "short" })} ${date.getFullYear()}`;
}

function getFortnightLabel(dateString) {
  return new Date(dateString).getDate() <= 15 ? "Primera Quincena" : "Segunda Quincena";
}

/* ---------- Mensajes ---------- */

function setMessage(element, message, mode) {
  if (!element) return;
  element.textContent = message;
  element.className = `form-message form-message--${mode}`;
}

function setFormMessage(message, mode) { setMessage(elements.formMessage, message, mode); }
function setCategoryMessage(message, mode) { setMessage(elements.categoryMessage, message, mode); }
function setIngresoMessage(message, mode) { setMessage(elements.ingresoMessage, message, mode); }
function setPagoMessage(message, mode) { setMessage(elements.pagoMessage, message, mode); }
function setLoginMessage(message, mode) { setMessage(elements.loginMessage, message, mode); }

function setMetaMessage(message, mode) {
  setMessage(elements.metaFormMessage, message, mode);
  if (message) {
    setTimeout(() => {
      if (elements.metaFormMessage.textContent === message) {
        setMessage(elements.metaFormMessage, "", "info");
      }
    }, 5000);
  }
}

function setConnectionStatus(message, mode) {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.className = `topbar__status topbar__status--${mode}`;
}

/* ---------- API ---------- */

function getApiBaseUrl() {
  const config = window.APP_CONFIG || {};
  return config.apiBaseUrl ? String(config.apiBaseUrl).trim() : "";
}

async function apiGet(params) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) throw new Error("URL no configurada");
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${apiBaseUrl}?${query}`);
  if (!response.ok) throw new Error("No se pudo leer la base de datos");
  return response.json();
}

async function apiPost(resource, data) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) throw new Error("URL no configurada");
  const response = await fetch(apiBaseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ resource, data })
  });
  if (!response.ok) throw new Error("No se pudo guardar en Google Sheets");
  const result = await response.json();
  if (result && result.error) throw new Error(result.error);
  return result;
}

function describeError(error, fallback) {
  if (error instanceof TypeError) {
    return "No se pudo conectar con Google Sheets. Revisa tu conexión o la URL en config.js.";
  }
  return error && error.message ? error.message : fallback;
}

/* ---------- Normalización de datos remotos ---------- */

function normalizeCategorias(data) {
  return (data || []).map((item) => ({
    id: String(item.id || item.ID_Categoria || `CAT_${Math.random()}`),
    nombre: item.nombre || item.Nombre_Categoria || "",
    icono: item.icono || item.Icono || "",
    activa: item.activa !== undefined ? item.activa : String(item.Activa).toUpperCase() === "TRUE"
  }));
}

function normalizeGastos(data) {
  return (data || []).map((item) => ({
    id: String(item.id || item.ID_Gasto || `G_${Math.random()}`),
    usuario: session ? session.id : "",
    fecha: String(item.fecha || item.Fecha || "").slice(0, 10),
    concepto: item.concepto || item.Concepto || "",
    categoria: item.categoria || item.Categoria || "",
    monto: Number(item.monto || item.Monto || 0),
    factura: item.factura || item.Ruta_Factura || "Sin adjunto",
    metodo: item.metodo || item.Metodo_Pago || "No definido",
    observaciones: item.observaciones || item.Observaciones || ""
  }));
}

function normalizeIngresos(data) {
  return (data || []).map((item) => ({
    id: String(item.id || item.ID_Ingreso || `I_${Math.random()}`),
    usuario: session ? session.id : "",
    fecha: String(item.fecha || item.Fecha || "").slice(0, 10),
    fuente: item.fuente || item.Fuente || "",
    categoria: item.categoria || item.Categoria || "Otros",
    monto: Number(item.monto || item.Monto || 0),
    metodo: item.metodo || item.Metodo || "",
    observaciones: item.observaciones || item.Observaciones || ""
  }));
}

function normalizePagos(data) {
  return (data || []).map((item) => ({
    id: String(item.id || item.ID_Pago || `P_${Math.random()}`),
    usuario: session ? session.id : "",
    servicio: item.servicio || item.Nombre_Servicio || "",
    categoria: item.categoria || item.Categoria || "",
    diaVence: Number(item.diaVence || item.Dia_Vence || 1),
    montoEstimado: Number(item.montoEstimado || item.Monto_Estimado || 0),
    estado: item.estado || item.Estado || "Pendiente",
    ultimoPago: String(item.ultimoPago || item.Ultimo_Pago_Fecha || "").slice(0, 10)
  }));
}

function normalizarFechaMeta(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeMetas(data) {
  return (data || []).map((item) => ({
    id: String(item.id || item.ID_Meta || `META_${Math.random()}`),
    usuario: session ? session.id : "",
    nombre: item.nombre || item.Nombre_Meta || "",
    categoria: item.categoria || item.Categoria || "Otros",
    montoObjetivo: Number(item.montoObjetivo || item.Monto_Objetivo || 0),
    montoAhorrado: Number(item.montoAhorrado || item.Monto_Ahorrado || 0),
    fechaLimite: normalizarFechaMeta(item.fechaLimite || item.Fecha_Limite),
    descripcion: item.descripcion || item.Descripcion || "",
    estado: item.estado || item.Estado || "Activa",
    fechaCreacion: normalizarFechaMeta(item.fechaCreacion || item.Fecha_Creacion)
  }));
}

function normalizeMenu(data) {
  return (data || [])
    .map((item) => ({
      id: String(item.id || item.ID_Opcion || ""),
      etiqueta: item.etiqueta || item.Etiqueta || "",
      seccion: String(item.seccion || item.Seccion || "").trim(),
      usuarios: String(item.usuarios !== undefined ? item.usuarios : (item.Usuarios || "")).trim(),
      orden: Number(item.orden || item.Orden || 99),
      activa: item.activa !== undefined ? item.activa : String(item.Activa).toUpperCase() === "TRUE"
    }))
    .filter((item) => item.etiqueta && SECCIONES[item.seccion]);
}

async function loadRemoteData(userId) {
  const data = await apiGet({ resource: "bootstrap", usuario: userId });
  return {
    menu: normalizeMenu(data.menu),
    categorias: normalizeCategorias(data.categorias),
    gastos: normalizeGastos(data.gastos),
    ingresos: normalizeIngresos(data.ingresos),
    pagos: normalizePagos(data.pagos),
    metas: normalizeMetas(data.metas)
  };
}

/* ---------- Menú y secciones ---------- */

function isMenuVisibleFor(item, userId) {
  if (item.activa === false || String(item.activa).toUpperCase() === "FALSE") return false;
  const list = item.usuarios.trim().toLowerCase();
  if (!list || list === "todos" || list === "*") return true;
  return list.split(",").map((value) => value.trim()).includes(String(userId).toLowerCase());
}

function allowedSections() {
  const userId = session ? session.id : "";
  return menuItems
    .filter((item) => isMenuVisibleFor(item, userId))
    .sort((a, b) => a.orden - b.orden)
    .map((item) => item.seccion);
}

function renderNav() {
  const userId = session ? session.id : "";
  const visibles = menuItems
    .filter((item) => isMenuVisibleFor(item, userId))
    .sort((a, b) => a.orden - b.orden);

  elements.navLinks.innerHTML = "";
  visibles.forEach((item) => {
    const link = document.createElement("a");
    link.className = "nav__link";
    link.href = `#${item.seccion}`;
    link.dataset.nav = item.seccion;
    link.textContent = item.etiqueta;
    elements.navLinks.appendChild(link);
  });

  elements.quickExpenseButton.hidden = !allowedSections().includes("registro");
}

function showSection(sectionId) {
  const permitidas = allowedSections();
  if (!permitidas.length) return;

  const target = permitidas.includes(sectionId) ? sectionId : permitidas[0];

  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("is-active", section.id === target);
  });

  elements.navLinks.querySelectorAll(".nav__link").forEach((link) => {
    link.classList.toggle("nav__link--active", link.dataset.nav === target);
  });

  const info = SECCIONES[target] || {};
  elements.currentSectionEyebrow.textContent = info.eyebrow || "";
  elements.currentSectionTitle.textContent = info.titulo || "";
}

/* ---------- Render ---------- */

function renderCategoriaOptions() {
  const activas = state.categorias.filter((categoria) => categoria.activa);

  elements.categoriaSelect.innerHTML = "";
  activas.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria.nombre;
    option.textContent = categoria.nombre;
    elements.categoriaSelect.appendChild(option);
  });

  if (elements.pagoCategoriaInput) {
    const valorActual = elements.pagoCategoriaInput.value;
    elements.pagoCategoriaInput.innerHTML = "";
    activas.forEach((categoria) => {
      const option = document.createElement("option");
      option.value = categoria.nombre;
      option.textContent = categoria.nombre;
      elements.pagoCategoriaInput.appendChild(option);
    });
    if (valorActual && activas.some((c) => c.nombre === valorActual)) {
      elements.pagoCategoriaInput.value = valorActual;
    }
  }
}

function renderCategoriasList() {
  elements.categoriasList.innerHTML = "";
  const activas = state.categorias.filter((categoria) => categoria.activa);
  if (!activas.length) {
    elements.categoriasList.innerHTML = '<p class="empty-state"><strong>Aún sin categorías</strong>Crea tu primera categoría personalizada.</p>';
    return;
  }
  activas
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .forEach((categoria) => {
      const item = document.createElement("article");
      item.className = "category-item";
      item.innerHTML = `
        <div>
          <p class="list-item__title">${categoria.nombre}</p>
          <p class="list-item__meta">Icono: ${categoria.icono || "sin definir"}</p>
        </div>
        <span class="status status--ok">Activa</span>
      `;
      elements.categoriasList.appendChild(item);
    });
}

function sumBy(list, predicate, selector) {
  return list.filter(predicate).reduce((acc, item) => acc + Number(selector(item) || 0), 0);
}

function renderStats() {
  const hoy = todayISO();
  const gastoHoy = sumBy(state.gastos, (g) => g.fecha === hoy, (g) => g.monto);
  const gastoQuincena = sumBy(state.gastos, (g) => isCurrentFortnight(g.fecha), (g) => g.monto);
  const gastoMes = sumBy(state.gastos, (g) => isCurrentMonth(g.fecha), (g) => g.monto);
  const ingresoMes = sumBy(state.ingresos, (i) => isCurrentMonth(i.fecha), (i) => i.monto);
  const ingresoTotal = sumBy(state.ingresos, () => true, (i) => i.monto);
  const saldoMes = ingresoMes - gastoMes;

  const pagosPendientes = sumBy(state.pagos, (p) => p.estado === "Pendiente", (p) => p.montoEstimado);
  const pagosPagados = sumBy(state.pagos, (p) => p.estado === "Pagado", (p) => p.montoEstimado);
  const pagosTotal = pagosPendientes + pagosPagados;

  const metasActivas = state.metas.filter((m) => m.estado === "Activa");
  const ahorroTotal = metasActivas.reduce((acc, m) => acc + Number(m.montoAhorrado || 0), 0);
  const montoTotalMetas = metasActivas.reduce((acc, m) => acc + Number(m.montoObjetivo || 0), 0);
  const avanceGeneral = montoTotalMetas > 0 ? Math.min(100, Math.round((ahorroTotal / montoTotalMetas) * 100)) : 0;

  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  set("gastoHoy", formatCurrency(gastoHoy));
  set("gastoQuincena", formatCurrency(gastoQuincena));
  set("gastoMes", formatCurrency(gastoMes));
  set("ingresoMes", formatCurrency(ingresoMes));
  set("saldoMes", formatCurrency(saldoMes));
  set("pagosPendientes", formatCurrency(pagosPendientes));

  set("dashboardAhorro", formatCurrency(ahorroTotal));
  set("dashboardMetas", metasActivas.length);

  set("ingresoMesCard", formatCurrency(ingresoMes));
  set("ingresoTotalCard", formatCurrency(ingresoTotal));
  set("saldoDisponibleCard", formatCurrency(saldoMes));

  set("pagosPendientesCard", formatCurrency(pagosPendientes));
  set("pagosPagadosCard", formatCurrency(pagosPagados));
  set("pagosTotalCard", formatCurrency(pagosTotal));

  set("metasActivas", metasActivas.length);
  set("ahorroTotal", formatCurrency(ahorroTotal));
  set("montoTotalMetas", formatCurrency(montoTotalMetas));
  set("avanceGeneral", `${avanceGeneral}%`);

  const saldoNode = document.getElementById("saldoMes");
  if (saldoNode) {
    saldoNode.classList.toggle("is-negative", saldoMes < 0);
  }
}

function renderChart() {
  elements.categoriaChart.innerHTML = "";
  const totals = state.gastos.reduce((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + Number(gasto.monto || 0);
    return acc;
  }, {});
  const values = Object.values(totals);
  if (!values.length) {
    elements.categoriaChart.innerHTML = '<p class="empty-state"><strong>Sin datos para graficar</strong>Cuando registres gastos, aquí verás su distribución por categoría.</p>';
    return;
  }
  const maxValue = Math.max(...values);
  Object.entries(totals).forEach(([categoria, total]) => {
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML = `
      <div class="chart-row__meta">
        <strong>${categoria}</strong>
        <span>${formatCurrency(total)}</span>
      </div>
      <div class="bar"><span style="width: ${(total / maxValue) * 100}%"></span></div>
    `;
    elements.categoriaChart.appendChild(row);
  });
}

function renderRecentExpenses() {
  elements.ultimosGastos.innerHTML = "";
  const recent = state.gastos
    .slice()
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  if (!recent.length) {
    elements.ultimosGastos.innerHTML = '<p class="empty-state"><strong>Aún no hay movimientos</strong>Registra tu primer gasto para verlo aquí.</p>';
    return;
  }

  recent.forEach((gasto) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <div>
        <p class="list-item__title">${gasto.concepto}</p>
        <p class="list-item__meta">${gasto.fecha} · ${gasto.categoria}</p>
      </div>
      <span class="amount">${formatCurrency(gasto.monto)}</span>
    `;
    elements.ultimosGastos.appendChild(item);
  });
}

function renderHistorial(searchTerm = "") {
  elements.historialTable.innerHTML = "";
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = state.gastos
    .slice()
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .filter((gasto) => {
      if (!normalizedSearch) return true;
      return `${gasto.concepto} ${gasto.categoria} ${gasto.metodo}`.toLowerCase().includes(normalizedSearch);
    });

  filtered.forEach((gasto) => {
    const facturaCell = isFacturaUrl(gasto.factura)
      ? `<a href="${gasto.factura}" target="_blank" rel="noopener noreferrer">Ver factura</a>`
      : gasto.factura;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${gasto.fecha}</td>
      <td>${gasto.concepto}</td>
      <td><span class="tag">${gasto.categoria}</span></td>
      <td class="amount">${formatCurrency(gasto.monto)}</td>
      <td>${facturaCell}</td>
    `;
    elements.historialTable.appendChild(tr);
  });

  if (!filtered.length) {
    elements.historialTable.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state"><strong>Sin resultados</strong>No hay gastos que coincidan con tu búsqueda.</td>
      </tr>
    `;
  }
}

function renderIngresos() {
  elements.ingresosTable.innerHTML = "";
  const ingresos = state.ingresos.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  ingresos.forEach((ingreso) => {
    const tr = document.createElement("tr");
    tr.dataset.ingresoId = ingreso.id;
    tr.innerHTML = `
      <td>${ingreso.fecha}</td>
      <td>${ingreso.fuente}</td>
      <td><span class="tag">${ingreso.categoria}</span></td>
      <td class="amount amount--income">${formatCurrency(ingreso.monto)}</td>
      <td>${ingreso.metodo || "-"}</td>
      <td class="table-actions">
        <button type="button" class="table-button table-button--danger" data-action="eliminar-ingreso">Eliminar</button>
      </td>
    `;
    elements.ingresosTable.appendChild(tr);
  });

  if (!ingresos.length) {
    elements.ingresosTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state"><strong>Sin ingresos registrados</strong>Registra cuándo te pagaron y el monto recibido.</td>
      </tr>
    `;
  }
}

function renderPagos() {
  elements.pagosGrid.innerHTML = "";
  const pagos = state.pagos.slice().sort((a, b) => a.diaVence - b.diaVence);

  if (!pagos.length) {
    elements.pagosGrid.innerHTML = '<p class="empty-state" style="grid-column:1/-1;"><strong>Sin gastos fijos</strong>Programa tus pagos recurrentes con el formulario de arriba.</p>';
    return;
  }

  pagos.forEach((pago) => {
    const pagado = pago.estado === "Pagado";
    const card = document.createElement("article");
    card.className = "payment-card";
    card.dataset.pagoId = pago.id;
    card.innerHTML = `
      <div class="panel__header">
        <div>
          <p class="eyebrow">${pago.categoria || "Sin categoría"}</p>
          <h4>${pago.servicio}</h4>
        </div>
        <span class="status ${pagado ? "status--ok" : "status--pending"}">${pago.estado}</span>
      </div>
      <div class="payment-card__row">
        <span>Vence el día ${pago.diaVence}</span>
        <span>${pago.ultimoPago ? `Último pago: ${pago.ultimoPago}` : "Sin pagos aún"}</span>
      </div>
      <div class="payment-card__amount">${formatCurrency(pago.montoEstimado)}</div>
      <div class="payment-card__edit">
        <input type="number" min="0" class="pago-monto-input" value="${pago.montoEstimado}" aria-label="Nuevo monto del pago">
        <button type="button" class="goal-card__btn" data-action="actualizar-monto">Actualizar monto</button>
      </div>
      <div class="payment-card__actions">
        <button type="button" class="goal-card__btn" data-action="cambiar-estado">${pagado ? "Marcar pendiente" : "Marcar pagado"}</button>
        <button type="button" class="goal-card__btn goal-card__btn--danger" data-action="eliminar-pago">Eliminar</button>
      </div>
    `;
    elements.pagosGrid.appendChild(card);
  });
}

function renderMetas() {
  elements.metasGrid.innerHTML = "";
  const metasActivas = state.metas.filter((m) => m.estado === "Activa");
  const hoy = todayISO();

  if (!metasActivas.length) {
    elements.metasGrid.innerHTML = '<p class="empty-state" style="grid-column:1/-1;"><strong>¡Crea tu primera meta!</strong>Define un proyecto a futuro y empieza a ahorrar para cumplirlo.</p>';
    return;
  }

  metasActivas
    .slice()
    .sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite))
    .forEach((meta) => {
      const objetivo = Number(meta.montoObjetivo) || 0;
      const ahorrado = Number(meta.montoAhorrado) || 0;
      const progreso = objetivo > 0 ? Math.min(100, Math.round((ahorrado / objetivo) * 100)) : 0;
      const diasRestantes = daysBetween(hoy, meta.fechaLimite);
      const urgente = progreso < 50 && diasRestantes <= 30;
      const deadlineClass = urgente ? "goal-card__deadline goal-card__deadline--urgent" : "goal-card__deadline";
      const deadlineText = diasRestantes > 0
        ? `${diasRestantes} día${diasRestantes === 1 ? "" : "s"} restante${diasRestantes === 1 ? "" : "s"}`
        : diasRestantes === 0 ? "Hoy es el límite" : `Vencida (${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) === 1 ? "" : "s"})`;
      const barVariant = progreso >= 100 ? "bar bar--success" : (urgente ? "bar bar--warning" : "bar bar--info");
      const completada = progreso >= 100;
      const estadoBadge = completada
        ? '<span class="status status--completed">¡Completada!</span>'
        : `<span class="tag tag--${slugifyMetaCategoria(meta.categoria)}">${meta.categoria}</span>`;

      const card = document.createElement("article");
      card.className = "goal-card";
      card.dataset.metaId = meta.id;
      card.innerHTML = `
        <div class="goal-card__header">
          <div>
            <h5 class="goal-card__title">${meta.nombre}</h5>
            <p class="goal-card__meta">${meta.descripcion || "Meta de ahorro personal"}</p>
          </div>
          ${estadoBadge}
        </div>
        <div class="goal-card__amounts">
          <span class="goal-card__saved">${formatCurrency(ahorrado)}</span>
          <span class="goal-card__target">/ ${formatCurrency(objetivo)}</span>
        </div>
        <div class="${barVariant}"><span style="width: ${progreso}%"></span></div>
        <div class="goal-card__progress-info">
          <span>${progreso}% completado</span>
          <span>${formatCurrency(Math.max(0, objetivo - ahorrado))} restante</span>
        </div>
        <div class="goal-card__actions" ${completada ? 'style="display:none"' : ""}>
          <input type="number" placeholder="Monto a aportar" min="1" class="aporte-input">
          <button type="button" class="goal-card__btn" data-action="aportar">Aportar</button>
        </div>
        <button type="button" class="goal-card__btn goal-card__btn--danger" data-action="eliminar-meta" style="width:100%;">Eliminar meta</button>
        <div class="${deadlineClass}">
          <span>Fecha límite: ${meta.fechaLimite || "sin definir"}</span>
          <span>${deadlineText}</span>
        </div>
      `;
      elements.metasGrid.appendChild(card);
    });
}

function renderAll() {
  renderCategoriaOptions();
  renderCategoriasList();
  renderStats();
  renderChart();
  renderRecentExpenses();
  renderHistorial(elements.historySearch.value);
  renderIngresos();
  renderPagos();
  renderMetas();
}

/* ---------- Sesión ---------- */

function updateProfileUI() {
  if (!session) return;
  elements.sidebarAvatar.textContent = initialsFromName(session.nombre);
  elements.sidebarAvatar.className = `user-avatar ${avatarVariant(session.id)}`;
  elements.sidebarUserName.textContent = session.nombre || session.id;
  elements.sidebarUserMail.textContent = session.correo || "";
  elements.topbarUserPill.textContent = `Sesión: ${session.nombre || session.id}`;
}

async function handleLogin(event) {
  event.preventDefault();
  const correo = elements.loginEmail.value.trim();

  if (!getApiBaseUrl()) {
    setLoginMessage("Falta configurar la URL del Web App en config.js.", "error");
    return;
  }

  elements.loginButton.disabled = true;
  setLoginMessage("Validando correo...", "info");

  try {
    const result = await apiGet({ resource: "login", correo });
    if (!result.success) {
      throw new Error(result.error || "Correo no autorizado");
    }
    session = {
      id: String(result.usuario.id || "").toLowerCase(),
      nombre: result.usuario.nombre || result.usuario.id,
      correo: result.usuario.correo || correo
    };
    saveJSON(SESSION_KEY, session);
    elements.loginForm.reset();
    setLoginMessage("", "info");
    await startApp();
  } catch (error) {
    setLoginMessage(describeError(error, "No se pudo iniciar sesión."), "error");
  } finally {
    elements.loginButton.disabled = false;
  }
}

function handleLogout() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
  elements.appShell.hidden = true;
  elements.loginScreen.hidden = false;
  elements.navLinks.innerHTML = "";
  closeSidebar();
  setLoginMessage("", "info");
}

async function startApp() {
  elements.loginScreen.hidden = true;
  elements.appShell.hidden = false;
  updateProfileUI();
  setFechaInputs();

  try {
    const remote = await loadRemoteData(session.id);
    if (remote.menu.length) menuItems = remote.menu;

    const data = currentUserData();
    data.categorias = remote.categorias.length ? remote.categorias : [...categoriasBase];
    data.gastos = remote.gastos;
    data.ingresos = remote.ingresos;
    data.pagos = remote.pagos;
    data.metas = remote.metas;
    saveData();
    setConnectionStatus("Conectado con Google Sheets", "success");
  } catch (error) {
    menuItems = MENU_DEFAULT.slice();
    const data = currentUserData();
    if (!data.categorias.length) data.categorias = [...categoriasBase];
    saveData();
    setConnectionStatus(`Modo local: ${describeError(error, "sin conexión")}`, "warning");
  }

  renderNav();
  showSection((window.location.hash || "").replace("#", "") || allowedSections()[0]);
  renderAll();
}

/* ---------- Formularios ---------- */

function setFechaInputs() {
  if (elements.fechaInput) elements.fechaInput.value = todayISO();
  if (elements.ingresoFechaInput) elements.ingresoFechaInput.value = todayISO();

  const metaFechaInput = document.getElementById("metaFechaInput");
  if (metaFechaInput) {
    metaFechaInput.value = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    metaFechaInput.min = todayISO();
  }
}

async function fileToPayload(file) {
  if (!file) return null;
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo de factura."));
    reader.readAsDataURL(file);
  });
  return { name: file.name, mimeType: file.type || "application/octet-stream", base64 };
}

async function createExpenseFromForm() {
  const fecha = elements.fechaInput.value;
  const facturaFile = document.getElementById("facturaInput").files[0];
  const facturaPayload = await fileToPayload(facturaFile);
  return {
    id: `G${Date.now()}`,
    usuario: session.id,
    fecha,
    concepto: document.getElementById("conceptoInput").value.trim(),
    categoria: elements.categoriaSelect.value,
    monto: Number(document.getElementById("montoInput").value),
    factura: facturaFile ? facturaFile.name : "Sin adjunto",
    facturaArchivo: facturaPayload,
    metodo: document.getElementById("metodoPagoInput").value,
    observaciones: document.getElementById("observacionesInput").value.trim(),
    mesAnio: getMonthLabel(fecha),
    quincena: getFortnightLabel(fecha)
  };
}

function createCategoryFromForm() {
  const nombre = document.getElementById("categoriaNombreInput").value.trim();
  const icono = document.getElementById("categoriaIconoInput").value.trim();
  if (!nombre) throw new Error("Ingresa un nombre para la categoría.");
  return {
    id: `CAT_${slugifyCategoryName(nombre) || Date.now()}`,
    nombre,
    icono,
    activa: true
  };
}

function createMetaFromForm() {
  const nombre = document.getElementById("metaNombreInput").value.trim();
  const montoObjetivo = Number(document.getElementById("metaMontoInput").value);
  const fechaLimite = document.getElementById("metaFechaInput").value;
  const categoria = document.getElementById("metaCategoriaInput").value;
  const descripcion = document.getElementById("metaDescripcionInput").value.trim();
  if (!nombre || !montoObjetivo || montoObjetivo <= 0 || !fechaLimite) {
    throw new Error("Completa todos los campos requeridos correctamente.");
  }
  return {
    id: `META_${Date.now()}`,
    usuario: session.id,
    nombre,
    categoria,
    montoObjetivo,
    montoAhorrado: 0,
    fechaLimite,
    descripcion,
    estado: "Activa",
    fechaCreacion: todayISO()
  };
}

function createIngresoFromForm() {
  const fecha = elements.ingresoFechaInput.value;
  const fuente = document.getElementById("ingresoFuenteInput").value.trim();
  const monto = Number(document.getElementById("ingresoMontoInput").value);
  if (!fecha) throw new Error("Indica la fecha en que te pagaron.");
  if (!fuente) throw new Error("Indica quién te pagó.");
  if (!monto || monto <= 0) throw new Error("El monto recibido debe ser mayor a cero.");
  return {
    id: `I${Date.now()}`,
    usuario: session.id,
    fecha,
    fuente,
    categoria: document.getElementById("ingresoCategoriaInput").value,
    monto,
    metodo: document.getElementById("ingresoMetodoInput").value,
    observaciones: document.getElementById("ingresoObservacionesInput").value.trim()
  };
}

function createPagoFromForm() {
  const servicio = document.getElementById("pagoServicioInput").value.trim();
  const montoEstimado = Number(document.getElementById("pagoMontoInput").value);
  const diaVence = Number(document.getElementById("pagoDiaInput").value);
  if (!servicio) throw new Error("Indica el servicio o concepto del gasto fijo.");
  if (!montoEstimado || montoEstimado <= 0) throw new Error("El monto debe ser mayor a cero.");
  if (!diaVence || diaVence < 1 || diaVence > 31) throw new Error("El día de vencimiento debe estar entre 1 y 31.");
  return {
    id: `P${Date.now()}`,
    usuario: session.id,
    servicio,
    categoria: elements.pagoCategoriaInput.value,
    diaVence,
    montoEstimado,
    estado: document.getElementById("pagoEstadoInput").value,
    ultimoPago: document.getElementById("pagoEstadoInput").value === "Pagado" ? todayISO() : ""
  };
}

/* ---------- Envíos a la base de datos ---------- */

async function submitExpense(expense) {
  if (!getApiBaseUrl()) {
    state.gastos = [expense, ...state.gastos];
    renderAll();
    setFormMessage("Gasto guardado en este navegador (sin conexión).", "success");
    return;
  }
  const result = await apiPost("gastos", expense);
  const saved = { ...expense, id: result.id || expense.id, factura: result.facturaUrl || expense.factura };
  state.gastos = [saved, ...state.gastos];
  renderAll();
  setFormMessage("Gasto guardado correctamente en Google Sheets.", "success");
}

async function submitCategory(category) {
  if (!getApiBaseUrl()) {
    state.categorias = [...state.categorias, category];
    renderAll();
    setCategoryMessage("Categoría guardada en este navegador (sin conexión).", "success");
    return;
  }
  const result = await apiPost("categorias", category);
  state.categorias = [...state.categorias, { ...category, id: result.id || category.id }];
  renderAll();
  setCategoryMessage("Categoría creada correctamente.", "success");
}

async function submitIngreso(ingreso) {
  if (!getApiBaseUrl()) {
    state.ingresos = [ingreso, ...state.ingresos];
    renderAll();
    setIngresoMessage("Ingreso guardado en este navegador (sin conexión).", "success");
    return;
  }
  const result = await apiPost("ingresos", ingreso);
  state.ingresos = [{ ...ingreso, id: result.id || ingreso.id }, ...state.ingresos];
  renderAll();
  setIngresoMessage("Ingreso registrado correctamente en Google Sheets.", "success");
}

async function submitPago(pago) {
  if (!getApiBaseUrl()) {
    state.pagos = [...state.pagos, pago];
    renderAll();
    setPagoMessage("Gasto fijo guardado en este navegador (sin conexión).", "success");
    return;
  }
  const result = await apiPost("pagos", pago);
  state.pagos = [...state.pagos, { ...pago, id: result.id || pago.id }];
  renderAll();
  setPagoMessage("Gasto fijo programado correctamente.", "success");
}

async function submitMeta(meta) {
  if (!getApiBaseUrl()) {
    state.metas = [...state.metas, meta];
    renderAll();
    setMetaMessage(`Meta "${meta.nombre}" creada en este navegador.`, "success");
    return;
  }
  const result = await apiPost("metas", meta);
  state.metas = [...state.metas, { ...meta, id: result.id || meta.id }];
  renderAll();
  setMetaMessage(`Meta "${meta.nombre}" creada exitosamente.`, "success");
}

async function updatePago(pagoId, cambios) {
  const pagos = state.pagos.map((pago) => (pago.id === pagoId ? { ...pago, ...cambios } : pago));

  if (getApiBaseUrl()) {
    await apiPost("actualizar_pago", { id: pagoId, ...cambios });
  }
  state.pagos = pagos;
  renderAll();
}

async function deletePago(pagoId) {
  if (getApiBaseUrl()) {
    await apiPost("eliminar_pago", { id: pagoId });
  }
  state.pagos = state.pagos.filter((pago) => pago.id !== pagoId);
  renderAll();
}

async function deleteIngreso(ingresoId) {
  if (getApiBaseUrl()) {
    await apiPost("eliminar_ingreso", { id: ingresoId });
  }
  state.ingresos = state.ingresos.filter((ingreso) => ingreso.id !== ingresoId);
  renderAll();
}

async function deleteMeta(metaId) {
  if (getApiBaseUrl()) {
    await apiPost("eliminar_meta", { idMeta: metaId });
  }
  state.metas = state.metas.filter((meta) => meta.id !== metaId);
  renderAll();
}

async function addAporteToMeta(metaId, monto) {
  const meta = state.metas.find((m) => m.id === metaId);
  if (!meta) return;

  const objetivo = Number(meta.montoObjetivo) || 0;
  const nuevoAhorrado = Math.min(objetivo, Number(meta.montoAhorrado || 0) + monto);

  if (getApiBaseUrl()) {
    await apiPost("aportes_metas", {
      idMeta: metaId,
      usuario: session.id,
      monto,
      notas: "Aporte desde la app"
    });
  }

  state.metas = state.metas.map((m) =>
    m.id === metaId
      ? { ...m, montoAhorrado: nuevoAhorrado, estado: objetivo > 0 && nuevoAhorrado >= objetivo ? "Completada" : m.estado }
      : m
  );

  if (objetivo > 0 && nuevoAhorrado >= objetivo) {
    setMetaMessage(`¡Felicitaciones! Completaste la meta "${meta.nombre}".`, "success");
  } else {
    setMetaMessage(`Aporte de ${formatCurrency(monto)} registrado para "${meta.nombre}".`, "success");
  }
  renderAll();
}

/* ---------- Menú lateral móvil ---------- */

function openSidebar() {
  document.body.style.overflow = "hidden";
  elements.sidebar.classList.add("is-open");
  elements.sidebarOverlay.classList.add("is-visible");
  elements.menuToggle.classList.add("is-open");
}

function closeSidebar() {
  document.body.style.overflow = "";
  elements.sidebar.classList.remove("is-open");
  elements.sidebarOverlay.classList.remove("is-visible");
  elements.menuToggle.classList.remove("is-open");
}

function toggleSidebar() {
  if (elements.sidebar.classList.contains("is-open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/* ---------- Eventos ---------- */

function attachEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", handleLogout);

  elements.navLinks.addEventListener("click", (event) => {
    const link = event.target.closest(".nav__link");
    if (!link) return;
    event.preventDefault();
    const section = link.dataset.nav;
    if (window.innerWidth <= 1100) closeSidebar();
    window.location.hash = `#${section}`;
    showSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("hashchange", () => {
    showSection((window.location.hash || "").replace("#", ""));
  });

  elements.quickExpenseButton.addEventListener("click", () => {
    window.location.hash = "#registro";
    showSection("registro");
  });

  elements.historySearch.addEventListener("input", (event) => {
    renderHistorial(event.target.value);
  });

  elements.movimientosTabs.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if (!tab) return;
    elements.movimientosTabs.querySelectorAll(".tab").forEach((item) => {
      item.classList.toggle("tab--active", item === tab);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `tab-${tab.dataset.tab}`);
    });
  });

  elements.expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarButton.disabled = true;
    setFormMessage("Guardando gasto...", "info");
    try {
      const expense = await createExpenseFromForm();
      await submitExpense(expense);
      elements.expenseForm.reset();
      elements.fechaInput.value = todayISO();
    } catch (error) {
      setFormMessage(describeError(error, "Ocurrió un error al guardar el gasto."), "error");
    } finally {
      elements.guardarButton.disabled = false;
    }
  });

  elements.categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarCategoriaButton.disabled = true;
    setCategoryMessage("Creando categoría...", "info");
    try {
      const category = createCategoryFromForm();
      const exists = state.categorias.some(
        (item) => item.nombre.trim().toLowerCase() === category.nombre.trim().toLowerCase()
      );
      if (exists) throw new Error("Esa categoría ya existe.");
      await submitCategory(category);
      elements.categoryForm.reset();
    } catch (error) {
      setCategoryMessage(describeError(error, "Ocurrió un error."), "error");
    } finally {
      elements.guardarCategoriaButton.disabled = false;
    }
  });

  elements.ingresoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarIngresoButton.disabled = true;
    setIngresoMessage("Guardando ingreso...", "info");
    try {
      const ingreso = createIngresoFromForm();
      await submitIngreso(ingreso);
      elements.ingresoForm.reset();
      elements.ingresoFechaInput.value = todayISO();
    } catch (error) {
      setIngresoMessage(describeError(error, "Ocurrió un error al guardar el ingreso."), "error");
    } finally {
      elements.guardarIngresoButton.disabled = false;
    }
  });

  elements.pagoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarPagoButton.disabled = true;
    setPagoMessage("Guardando gasto fijo...", "info");
    try {
      const pago = createPagoFromForm();
      await submitPago(pago);
      elements.pagoForm.reset();
      elements.pagoForm.elements.pagoDiaInput.value = 1;
    } catch (error) {
      setPagoMessage(describeError(error, "Ocurrió un error al guardar el gasto fijo."), "error");
    } finally {
      elements.guardarPagoButton.disabled = false;
    }
  });

  elements.ingresosTable.addEventListener("click", async (event) => {
    const button = event.target.closest('[data-action="eliminar-ingreso"]');
    if (!button) return;
    const row = button.closest("tr");
    const ingreso = state.ingresos.find((item) => item.id === row.dataset.ingresoId);
    if (!ingreso) return;
    if (!confirm(`¿Eliminar el ingreso de ${formatCurrency(ingreso.monto)} de "${ingreso.fuente}"?`)) return;
    try {
      await deleteIngreso(ingreso.id);
      setIngresoMessage("Ingreso eliminado.", "info");
    } catch (error) {
      setIngresoMessage(describeError(error, "No se pudo eliminar el ingreso."), "error");
    }
  });

  elements.pagosGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest(".payment-card");
    const pago = state.pagos.find((item) => item.id === card.dataset.pagoId);
    if (!pago) return;

    try {
      if (button.dataset.action === "actualizar-monto") {
        const nuevoMonto = Number(card.querySelector(".pago-monto-input").value);
        if (!nuevoMonto || nuevoMonto <= 0) throw new Error("Ingresa un monto válido.");
        await updatePago(pago.id, { montoEstimado: nuevoMonto });
        setPagoMessage(`Monto actualizado a ${formatCurrency(nuevoMonto)}.`, "success");
      }

      if (button.dataset.action === "cambiar-estado") {
        const pagado = pago.estado === "Pagado";
        await updatePago(pago.id, {
          estado: pagado ? "Pendiente" : "Pagado",
          ultimoPago: pagado ? pago.ultimoPago : todayISO()
        });
        setPagoMessage(pagado ? "Pago marcado como pendiente." : "Pago marcado como pagado.", "success");
      }

      if (button.dataset.action === "eliminar-pago") {
        if (!confirm(`¿Eliminar el gasto fijo "${pago.servicio}"?`)) return;
        await deletePago(pago.id);
        setPagoMessage("Gasto fijo eliminado.", "info");
      }
    } catch (error) {
      setPagoMessage(describeError(error, "No se pudo actualizar el pago."), "error");
    }
  });

  elements.metasGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest(".goal-card");
    const meta = state.metas.find((item) => item.id === card.dataset.metaId);
    if (!meta) return;

    try {
      if (button.dataset.action === "aportar") {
        const monto = Number(card.querySelector(".aporte-input").value);
        if (!monto || monto <= 0) throw new Error("Ingresa un monto de aporte válido.");
        await addAporteToMeta(meta.id, monto);
      }

      if (button.dataset.action === "eliminar-meta") {
        if (!confirm(`¿Seguro que deseas eliminar la meta "${meta.nombre}"?`)) return;
        await deleteMeta(meta.id);
        setMetaMessage("Meta eliminada correctamente.", "info");
      }
    } catch (error) {
      setMetaMessage(describeError(error, "No se pudo actualizar la meta."), "error");
    }
  });

  elements.metaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarMetaButton.disabled = true;
    setMetaMessage("Creando meta...", "info");
    try {
      const meta = createMetaFromForm();
      await submitMeta(meta);
      elements.metaForm.reset();
      setFechaInputs();
    } catch (error) {
      setMetaMessage(describeError(error, "Ocurrió un error al crear la meta."), "error");
    } finally {
      elements.guardarMetaButton.disabled = false;
    }
  });

  elements.menuToggle.addEventListener("click", toggleSidebar);
  elements.sidebarOverlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.sidebar.classList.contains("is-open")) {
      closeSidebar();
    }
  });

  const content = document.querySelector(".content");
  content.addEventListener("click", (event) => {
    if (
      window.innerWidth <= 1100 &&
      elements.sidebar.classList.contains("is-open") &&
      !elements.sidebar.contains(event.target) &&
      !elements.menuToggle.contains(event.target)
    ) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeSidebar();
  });
}

/* ---------- Arranque ---------- */

function boot() {
  attachEvents();
  if (session) {
    startApp();
  } else {
    elements.loginScreen.hidden = false;
    elements.appShell.hidden = true;
  }
}

boot();
