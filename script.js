const USUARIOS = {
  jefferson: {
    id: "jefferson",
    nombre: "Jefferson Rojas",
    iniciales: "JR",
    color: "jefferson"
  },
  juliana: {
    id: "juliana",
    nombre: "Juliana González",
    iniciales: "JG",
    color: "juliana"
  }
};

const categoriasBase = [
  { id: "CAT001", nombre: "Alimentacion", icono: "restaurant", activa: true },
  { id: "CAT002", nombre: "Servicios", icono: "bolt", activa: true },
  { id: "CAT003", nombre: "Ocio", icono: "mood", activa: true },
  { id: "CAT004", nombre: "Transporte", icono: "directions_car", activa: true },
  { id: "CAT005", nombre: "Salud", icono: "favorite", activa: true }
];

const STORAGE_KEY = "controlGastosApp_v2";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("No se pudo guardar en localStorage:", e);
  }
}

function buildDefaultData() {
  return {
    currentUser: "jefferson",
    jefferson: {
      categorias: [...categoriasBase],
      gastos: [],
      pagos: [],
      metas: []
    },
    juliana: {
      categorias: [...categoriasBase],
      gastos: [],
      pagos: [],
      metas: []
    }
  };
}

let appData = loadFromStorage() || buildDefaultData();

function currentUserData() {
  return appData[appData.currentUser] || appData.jefferson;
}

function saveState() {
  saveToStorage(appData);
}

const state = {
  get categorias() { return currentUserData().categorias; },
  set categorias(v) { currentUserData().categorias = v; saveState(); },
  get gastos() { return currentUserData().gastos; },
  set gastos(v) { currentUserData().gastos = v; saveState(); },
  get pagos() { return currentUserData().pagos; },
  set pagos(v) { currentUserData().pagos = v; saveState(); },
  get metas() { return currentUserData().metas; },
  set metas(v) { currentUserData().metas = v; saveState(); },
  source: "local"
};

const elements = {
  categoriaSelect: document.getElementById("categoriaSelect"),
  categoriasList: document.getElementById("categoriasList"),
  historialTable: document.getElementById("historialTable"),
  categoriaChart: document.getElementById("categoriaChart"),
  ultimosGastos: document.getElementById("ultimosGastos"),
  pagosGrid: document.getElementById("pagosGrid"),
  metasGrid: document.getElementById("metasGrid"),
  historySearch: document.getElementById("historySearch"),
  expenseForm: document.getElementById("expenseForm"),
  categoryForm: document.getElementById("categoryForm"),
  metaForm: document.getElementById("metaForm"),
  connectionStatus: document.getElementById("connectionStatus"),
  formMessage: document.getElementById("formMessage"),
  categoryMessage: document.getElementById("categoryMessage"),
  metaFormMessage: document.getElementById("metaFormMessage"),
  fechaInput: document.getElementById("fechaInput"),
  guardarButton: document.getElementById("guardarButton"),
  guardarCategoriaButton: document.getElementById("guardarCategoriaButton"),
  guardarMetaButton: document.getElementById("guardarMetaButton"),
  usuarioSelect: document.getElementById("usuarioSelect"),
  usuarioNombre: document.getElementById("usuarioNombre"),
  usuarioBadge: document.getElementById("usuarioBadge"),
  topbarAvatar: document.getElementById("topbarAvatar"),
  topbarUserName: document.getElementById("topbarUserName"),
  topbarUser: document.getElementById("topbarUser"),
  menuToggle: document.getElementById("menuToggle"),
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  navLinks: document.querySelectorAll(".nav__link")
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
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

function renderCategoriaOptions() {
  elements.categoriaSelect.innerHTML = "";
  state.categorias
    .filter((categoria) => categoria.activa)
    .forEach((categoria) => {
      const option = document.createElement("option");
      option.value = categoria.nombre;
      option.textContent = categoria.nombre;
      elements.categoriaSelect.appendChild(option);
    });
}

function renderCategoriasList() {
  elements.categoriasList.innerHTML = "";
  const activeCategories = state.categorias.filter((categoria) => categoria.activa);
  if (!activeCategories.length) {
    elements.categoriasList.innerHTML = '<p class="empty-state"><strong>Aún sin categorías</strong>Crea tu primera categoría personalizada.</p>';
    return;
  }
  activeCategories
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

function renderStats() {
  const now = new Date();
  const todayString = now.toISOString().slice(0, 10);
  const gastoHoy = state.gastos.filter((g) => g.fecha === todayString).reduce((acc, g) => acc + g.monto, 0);
  const gastoQuincena = state.gastos.filter((g) => isCurrentFortnight(g.fecha)).reduce((acc, g) => acc + g.monto, 0);
  const gastoMes = state.gastos.filter((g) => isCurrentMonth(g.fecha)).reduce((acc, g) => acc + g.monto, 0);
  const pagosPendientes = state.pagos.filter((p) => p.estado === "Pendiente").reduce((acc, p) => acc + p.montoEstimado, 0);

  document.getElementById("gastoHoy").textContent = formatCurrency(gastoHoy);
  document.getElementById("gastoQuincena").textContent = formatCurrency(gastoQuincena);
  document.getElementById("gastoMes").textContent = formatCurrency(gastoMes);
  document.getElementById("pagosPendientes").textContent = formatCurrency(pagosPendientes);

  const metasActivas = state.metas.filter((m) => m.estado === "Activa");
  const ahorroTotal = metasActivas.reduce((acc, m) => acc + m.montoAhorrado, 0);
  const montoTotalMetas = metasActivas.reduce((acc, m) => acc + m.montoObjetivo, 0);
  const avanceGeneral = montoTotalMetas > 0 ? Math.min(100, Math.round((ahorroTotal / montoTotalMetas) * 100)) : 0;

  document.getElementById("metasActivas").textContent = metasActivas.length;
  document.getElementById("ahorroTotal").textContent = formatCurrency(ahorroTotal);
  document.getElementById("montoTotalMetas").textContent = formatCurrency(montoTotalMetas);
  document.getElementById("avanceGeneral").textContent = avanceGeneral + "%";

  document.getElementById("dashboardAhorro").textContent = formatCurrency(ahorroTotal);
  document.getElementById("dashboardMetas").textContent = metasActivas.length;
}

function renderChart() {
  elements.categoriaChart.innerHTML = "";
  const totals = state.gastos.reduce((acc, gasto) => {
    acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.monto;
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
    .slice(0, 4);
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
  if (!state.gastos.length) {
    elements.ultimosGastos.innerHTML = '<p class="empty-state"><strong>Aún no hay movimientos</strong>Registra tu primer gasto para verlo aquí.</p>';
  }
}

function renderHistorial(searchTerm = "") {
  elements.historialTable.innerHTML = "";
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredExpenses = state.gastos
    .slice()
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .filter((gasto) => {
      if (!normalizedSearch) return true;
      return `${gasto.concepto} ${gasto.categoria} ${gasto.metodo}`.toLowerCase().includes(normalizedSearch);
    });
  filteredExpenses.forEach((gasto) => {
    const facturaCell = isFacturaUrl(gasto.factura)
      ? `<a href="${gasto.factura}" target="_blank" rel="noopener noreferrer">Ver factura</a>`
      : gasto.factura;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${gasto.fecha}</td>
      <td>${gasto.concepto}</td>
      <td><span class="tag">${gasto.categoria}</span></td>
      <td>${formatCurrency(gasto.monto)}</td>
      <td>${facturaCell}</td>
    `;
    elements.historialTable.appendChild(tr);
  });
  if (!filteredExpenses.length) {
    elements.historialTable.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state"><strong>Sin resultados</strong>No hay gastos que coincidan con tu búsqueda.</td>
      </tr>
    `;
  }
}

function renderPagos() {
  elements.pagosGrid.innerHTML = "";
  state.pagos.forEach((pago) => {
    const statusClass = pago.estado === "Pagado" ? "status--ok" : "status--pending";
    const card = document.createElement("article");
    card.className = "payment-card";
    card.innerHTML = `
      <div class="panel__header">
        <div>
          <p class="eyebrow">${pago.categoria}</p>
          <h4>${pago.servicio}</h4>
        </div>
        <span class="status ${statusClass}">${pago.estado}</span>
      </div>
      <div class="payment-card__row">
        <span>Vence el día ${pago.diaVence}</span>
        <span>ID ${pago.id}</span>
      </div>
      <div class="payment-card__amount">${formatCurrency(pago.montoEstimado)}</div>
    `;
    elements.pagosGrid.appendChild(card);
  });
  if (!state.pagos.length) {
    elements.pagosGrid.innerHTML = '<p class="empty-state" style="grid-column:1/-1;"><strong>Sin pagos programados</strong>Aquí aparecerán tus obligaciones fijas.</p>';
  }
}

function daysBetween(from, to) {
  const ms = new Date(to) - new Date(from);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function renderMetas() {
  elements.metasGrid.innerHTML = "";
  const metasActivas = state.metas.filter((m) => m.estado === "Activa");
  const hoy = new Date().toISOString().slice(0, 10);
  if (!metasActivas.length) {
    elements.metasGrid.innerHTML = '<p class="empty-state" style="grid-column:1/-1;"><strong>¡Crea tu primera meta!</strong>Define un proyecto a futuro y empieza a ahorrar para cumplirlo.</p>';
    return;
  }
  metasActivas
    .slice()
    .sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite))
    .forEach((meta) => {
      const progreso = Math.min(100, Math.round((meta.montoAhorrado / meta.montoObjetivo) * 100));
      const diasRestantes = daysBetween(hoy, meta.fechaLimite);
      const urgente = progreso < 50 && diasRestantes <= 30;
      const deadlineClass = urgente ? "goal-card__deadline goal-card__deadline--urgent" : "goal-card__deadline";
      const deadlineText = diasRestantes > 0
        ? `${diasRestantes} día${diasRestantes === 1 ? "" : "s"} restante${diasRestantes === 1 ? "" : "s"}`
        : diasRestantes === 0 ? "Hoy es el límite" : `Vencida (${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) === 1 ? "" : "s"})`;
      const barVariant = progreso >= 100 ? "bar bar--success" : (urgente ? "bar bar--warning" : "bar bar--info");
      const estadoBadge = progreso >= 100
        ? '<span class="status status--completed">¡Completada!</span>'
        : `<span class="tag tag--${slugifyMetaCategoria(meta.categoria)}">${meta.categoria}</span>`;
      const completada = progreso >= 100;

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
          <span class="goal-card__saved">${formatCurrency(meta.montoAhorrado)}</span>
          <span class="goal-card__target">/ ${formatCurrency(meta.montoObjetivo)}</span>
        </div>
        <div class="${barVariant}"><span style="width: ${progreso}%"></span></div>
        <div class="goal-card__progress-info">
          <span>${progreso}% completado</span>
          <span>${formatCurrency(meta.montoObjetivo - meta.montoAhorrado)} restante</span>
        </div>
        <div class="goal-card__actions" ${completada ? "style=\"display:none\"" : ""}>
          <input type="number" placeholder="Monto a aportar" min="1" class="aporte-input">
          <button type="button" class="goal-card__btn aporte-btn">Aportar</button>
        </div>
        <button type="button" class="goal-card__btn goal-card__btn--danger eliminar-meta-btn" style="width:100%;">Eliminar meta</button>
        <div class="${deadlineClass}">
          <span>📅</span>
          <span>Fecha límite: ${meta.fechaLimite} · ${deadlineText}</span>
        </div>
      `;
      elements.metasGrid.appendChild(card);
    });

  document.querySelectorAll(".aporte-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".goal-card");
      const metaId = card.dataset.metaId;
      const input = card.querySelector(".aporte-input");
      const monto = Number(input.value);
      if (!monto || monto <= 0) {
        setMetaMessage("Por favor ingresa un monto válido.", "error");
        return;
      }
      addAporteToMeta(metaId, monto);
    });
  });

  document.querySelectorAll(".eliminar-meta-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".goal-card");
      const metaId = card.dataset.metaId;
      const meta = state.metas.find((m) => m.id === metaId);
      if (!meta) return;
      const confirmar = confirm(`¿Seguro que deseas eliminar la meta "${meta.nombre}"? Esta acción no se puede deshacer.`);
      if (!confirmar) return;
      state.metas = state.metas.filter((m) => m.id !== metaId);
      renderAll();
      setMetaMessage("Meta eliminada correctamente.", "info");
    });
  });
}

function addAporteToMeta(metaId, monto) {
  const meta = state.metas.find((m) => m.id === metaId);
  if (!meta) return;
  meta.montoAhorrado = Math.min(meta.montoObjetivo, meta.montoAhorrado + monto);
  if (meta.montoAhorrado >= meta.montoObjetivo) {
    setMetaMessage(`¡Felicitaciones! Has completado la meta "${meta.nombre}". 🎉`, "success");
  } else {
    setMetaMessage(`Aporte de ${formatCurrency(monto)} agregado exitosamente.`, "success");
  }
  saveState();
  renderAll();
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
    usuario: appData.currentUser,
    nombre,
    categoria,
    montoObjetivo,
    montoAhorrado: 0,
    fechaLimite,
    descripcion,
    estado: "Activa",
    fechaCreacion: new Date().toISOString().slice(0, 10)
  };
}

function renderAll() {
  renderCategoriaOptions();
  renderCategoriasList();
  renderStats();
  renderChart();
  renderRecentExpenses();
  renderHistorial(elements.historySearch.value);
  renderPagos();
  renderMetas();
}

function updateUserUI() {
  const user = USUARIOS[appData.currentUser] || USUARIOS.jefferson;
  elements.usuarioSelect.value = user.id;
  elements.usuarioNombre.textContent = user.nombre;
  const badgeAvatar = elements.usuarioBadge.querySelector(".user-avatar");
  badgeAvatar.textContent = user.iniciales;
  badgeAvatar.classList.remove("user-avatar--jefferson", "user-avatar--juliana");
  badgeAvatar.classList.add(`user-avatar--${user.color}`);
  elements.topbarAvatar.textContent = user.iniciales;
  elements.topbarAvatar.classList.remove("user-avatar--jefferson", "user-avatar--juliana");
  elements.topbarAvatar.classList.add(`user-avatar--${user.color}`);
  elements.topbarUserName.textContent = user.nombre;
}

function switchUser(userId) {
  if (!USUARIOS[userId]) return;
  appData.currentUser = userId;
  saveState();
  updateUserUI();
  renderAll();
  setFormMessage(`Perfil cambiado: ${USUARIOS[userId].nombre}`, "info");
}

function getApiBaseUrl() {
  if (window.APP_CONFIG && window.APP_CONFIG.useDemoMode) return "";
  return window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl ? window.APP_CONFIG.apiBaseUrl.trim() : "";
}

function setConnectionStatus(message, mode) {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.className = `topbar__status topbar__status--${mode}`;
}

function setFormMessage(message, mode) {
  elements.formMessage.textContent = message;
  elements.formMessage.className = `form-message form-message--${mode} full-width`;
}

function setCategoryMessage(message, mode) {
  elements.categoryMessage.textContent = message;
  elements.categoryMessage.className = `form-message form-message--${mode}`;
}

function setMetaMessage(message, mode) {
  elements.metaFormMessage.textContent = message;
  elements.metaFormMessage.className = `form-message form-message--${mode} full-width`;
  if (message) {
    setTimeout(() => {
      if (elements.metaFormMessage.textContent === message) {
        elements.metaFormMessage.textContent = "";
        elements.metaFormMessage.className = "form-message full-width";
      }
    }, 5000);
  }
}

function getMonthLabel(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleString("es-ES", { month: "short" })} ${date.getFullYear()}`;
}

function getFortnightLabel(dateString) {
  const date = new Date(dateString);
  return date.getDate() <= 15 ? "Primera Quincena" : "Segunda Quincena";
}

function isFacturaUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function normalizeBootstrapData(data) {
  return {
    categorias: (data.categorias || []).map((item) => ({
      id: item.id || item.ID_Categoria || crypto.randomUUID(),
      nombre: item.nombre || item.Nombre_Categoria || "",
      icono: item.icono || item.Icono || "",
      activa: item.activa !== undefined ? item.activa : String(item.Activa).toUpperCase() === "TRUE"
    })),
    gastos: (data.gastos || []).map((item) => ({
      id: item.id || item.ID_Gasto || crypto.randomUUID(),
      usuario: appData.currentUser,
      fecha: item.fecha || item.Fecha || "",
      concepto: item.concepto || item.Concepto || "",
      categoria: item.categoria || item.Categoria || "",
      monto: Number(item.monto || item.Monto || 0),
      factura: item.factura || item.Ruta_Factura || "Sin adjunto",
      metodo: item.metodo || item.Metodo_Pago || "No definido",
      observaciones: item.observaciones || item.Observaciones || ""
    })),
    pagos: (data.pagos || []).map((item) => ({
      id: item.id || item.ID_Pago || crypto.randomUUID(),
      usuario: appData.currentUser,
      servicio: item.servicio || item.Nombre_Servicio || "",
      categoria: item.categoria || item.Categoria || "",
      diaVence: Number(item.diaVence || item.Dia_Vence || 0),
      montoEstimado: Number(item.montoEstimado || item.Monto_Estimado || 0),
      estado: item.estado || item.Estado || "Pendiente"
    })),
    source: "remote"
  };
}

async function loadRemoteData() {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) throw new Error("URL no configurada");
  const response = await fetch(`${apiBaseUrl}?resource=bootstrap`);
  if (!response.ok) throw new Error("No se pudo leer Google Sheets");
  const data = await response.json();
  return normalizeBootstrapData(data);
}

async function submitExpense(expense) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    const list = [...state.gastos];
    list.unshift(expense);
    state.gastos = list;
    state.source = "local";
    renderAll();
    setFormMessage("Gasto guardado correctamente en este navegador.", "success");
    return;
  }
  const response = await fetch(apiBaseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ resource: "gastos", data: expense })
  });
  if (!response.ok) throw new Error("No se pudo guardar el gasto en Google Sheets");
  const result = await response.json();
  const savedExpense = { ...expense, id: result.id || expense.id, factura: result.facturaUrl || expense.factura };
  const list = [...state.gastos];
  list.unshift(savedExpense);
  state.gastos = list;
  state.source = "remote";
  renderAll();
  setFormMessage("Gasto guardado correctamente en Google Sheets.", "success");
}

async function submitCategory(category) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    const list = [...state.categorias, category];
    state.categorias = list;
    renderAll();
    elements.categoriaSelect.value = category.nombre;
    setCategoryMessage("Categoria guardada correctamente en este navegador.", "success");
    return;
  }
  const response = await fetch(apiBaseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ resource: "categorias", data: category })
  });
  if (!response.ok) throw new Error("No se pudo guardar la categoria en Google Sheets");
  const result = await response.json();
  const savedCategory = { ...category, id: result.id || category.id };
  const list = [...state.categorias, savedCategory];
  state.categorias = list;
  renderAll();
  elements.categoriaSelect.value = savedCategory.nombre;
  setCategoryMessage("Categoria creada correctamente.", "success");
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
    usuario: appData.currentUser,
    fecha,
    concepto: document.getElementById("conceptoInput").value.trim(),
    categoria: elements.categoriaSelect.value,
    monto: Number(document.getElementById("montoInput").value),
    factura: facturaFile?.name || "Sin adjunto",
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

function openSidebar() {
  elements.sidebar.classList.add("is-open");
  elements.sidebarOverlay.classList.add("is-visible");
  elements.menuToggle.classList.add("is-open");
}

function closeSidebar() {
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

function updateActiveNavLink() {
  const hash = window.location.hash || "#dashboard";
  elements.navLinks.forEach((link) => {
    const target = link.getAttribute("href");
    link.classList.toggle("nav__link--active", target === hash);
  });
}

function attachEvents() {
  elements.historySearch.addEventListener("input", (event) => {
    renderHistorial(event.target.value);
  });

  elements.expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarButton.disabled = true;
    setFormMessage("Guardando gasto...", "info");
    try {
      const expense = await createExpenseFromForm();
      await submitExpense(expense);
      elements.expenseForm.reset();
      elements.fechaInput.value = new Date().toISOString().slice(0, 10);
    } catch (error) {
      const message = error instanceof TypeError
        ? "No se pudo conectar con Apps Script. Si pruebas desde localhost puede ser una restricción de CORS."
        : error.message || "Ocurrio un error al guardar el gasto.";
      setFormMessage(message, "error");
    } finally {
      elements.guardarButton.disabled = false;
    }
  });

  elements.categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarCategoriaButton.disabled = true;
    setCategoryMessage("Creando categoria...", "info");
    try {
      const category = createCategoryFromForm();
      const exists = state.categorias.some(
        (item) => item.nombre.trim().toLowerCase() === category.nombre.trim().toLowerCase()
      );
      if (exists) throw new Error("Esa categoria ya existe.");
      await submitCategory(category);
      elements.categoryForm.reset();
    } catch (error) {
      const message = error instanceof TypeError
        ? "No se pudo conectar con Apps Script."
        : error.message || "Ocurrio un error.";
      setCategoryMessage(message, "error");
    } finally {
      elements.guardarCategoriaButton.disabled = false;
    }
  });

  elements.metaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.guardarMetaButton.disabled = true;
    setMetaMessage("Creando meta...", "info");
    try {
      const meta = createMetaFromForm();
      const list = [...state.metas, meta];
      state.metas = list;
      saveState();
      renderAll();
      elements.metaForm.reset();
      document.getElementById("metaFechaInput").value = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setMetaMessage(`Meta "${meta.nombre}" creada exitosamente. ¡A ahorrar se dijo! 💪`, "success");
    } catch (error) {
      setMetaMessage(error.message || "Ocurrió un error al crear la meta.", "error");
    } finally {
      elements.guardarMetaButton.disabled = false;
    }
  });

  elements.usuarioSelect.addEventListener("change", (e) => {
    switchUser(e.target.value);
    if (window.innerWidth <= 1100) closeSidebar();
  });

  elements.menuToggle.addEventListener("click", toggleSidebar);
  elements.sidebarOverlay.addEventListener("click", closeSidebar);

  elements.navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 1100) setTimeout(closeSidebar, 150);
    });
  });

  window.addEventListener("hashchange", updateActiveNavLink);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) {
      elements.sidebar.classList.remove("is-open");
      elements.sidebarOverlay.classList.remove("is-visible");
      elements.menuToggle.classList.remove("is-open");
    }
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");
    });
  });
}

async function initializeApp() {
  elements.fechaInput.value = new Date().toISOString().slice(0, 10);
  const metaFechaInput = document.getElementById("metaFechaInput");
  if (metaFechaInput) {
    metaFechaInput.value = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    metaFechaInput.min = new Date().toISOString().slice(0, 10);
  }
  attachEvents();
  updateUserUI();
  updateActiveNavLink();

  try {
    const remote = await loadRemoteData();
    currentUserData().categorias = remote.categorias;
    currentUserData().gastos = remote.gastos;
    currentUserData().pagos = remote.pagos;
    saveState();
    setConnectionStatus("Conectado con Google Sheets", "success");
  } catch (error) {
    setConnectionStatus("Modo local activo (sin conexión a Google Sheets)", "warning");
    if (!state.gastos.length) {
      setFormMessage("Los datos se guardan temporalmente en este navegador. Verifica la URL en config.js para conectar con Google Sheets.", "info");
    }
  }
  renderAll();
}

initializeApp();
