const SHEET_NAMES = {
  usuarios: "Usuarios",
  gastos: "Gastos",
  pagos: "Calendario_Pagos",
  categorias: "Categorias",
  metas: "Metas_Ahorro",
  aportesMetas: "Aportes_Metas"
};

const USUARIOS_MAP = {
  jefferson: { nombre: "Jefferson Rojas", id: "jefferson" },
  juliana: { nombre: "Juliana González", id: "juliana" }
};

const DRIVE_FOLDER_ID = "";

function doGet(e) {
  const resource = (e && e.parameter && e.parameter.resource) || "bootstrap";
  const usuario = (e && e.parameter && e.parameter.usuario) || "";

  try {
    if (resource === "bootstrap") {
      return jsonOutput({
        usuarios: readTable_(SHEET_NAMES.usuarios),
        categorias: readTable_(SHEET_NAMES.categorias),
        gastos: filterByUser_(readTable_(SHEET_NAMES.gastos), usuario, "ID_Usuario"),
        pagos: filterByUser_(readTable_(SHEET_NAMES.pagos), usuario, "ID_Usuario"),
        metas: filterByUser_(readTable_(SHEET_NAMES.metas), usuario, "ID_Usuario"),
        aportesMetas: filterByUser_(readTable_(SHEET_NAMES.aportesMetas), usuario, "ID_Usuario")
      });
    }

    if (resource === "usuarios") {
      return jsonOutput({ usuarios: readTable_(SHEET_NAMES.usuarios) });
    }

    if (resource === "gastos") {
      const data = filterByUser_(readTable_(SHEET_NAMES.gastos), usuario, "ID_Usuario");
      return jsonOutput({ gastos: data });
    }

    if (resource === "pagos") {
      const data = filterByUser_(readTable_(SHEET_NAMES.pagos), usuario, "ID_Usuario");
      return jsonOutput({ pagos: data });
    }

    if (resource === "categorias") {
      return jsonOutput({ categorias: readTable_(SHEET_NAMES.categorias) });
    }

    if (resource === "metas") {
      const data = filterByUser_(readTable_(SHEET_NAMES.metas), usuario, "ID_Usuario");
      return jsonOutput({ metas: data });
    }

    if (resource === "aportes_metas") {
      const data = filterByUser_(readTable_(SHEET_NAMES.aportesMetas), usuario, "ID_Usuario");
      return jsonOutput({ aportesMetas: data });
    }

    if (resource === "inicializar") {
      const resultado = inicializarHojas_();
      return jsonOutput({ success: true, message: resultado });
    }

    return jsonOutput({ error: "Recurso no soportado" }, 400);
  } catch (error) {
    console.error("doGet error:", error.message, error.stack);
    return jsonOutput({ error: error.message }, 500);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const resource = payload.resource || "";

    if (resource === "gastos") {
      const expense = createExpense_(payload.data || {});
      return jsonOutput({
        success: true,
        id: expense.ID_Gasto,
        facturaUrl: expense.Ruta_Factura,
        message: "Gasto guardado correctamente"
      });
    }

    if (resource === "categorias") {
      const category = createCategory_(payload.data || {});
      return jsonOutput({
        success: true,
        id: category.ID_Categoria,
        message: "Categoria guardada correctamente"
      });
    }

    if (resource === "pagos") {
      const pago = createPago_(payload.data || {});
      return jsonOutput({
        success: true,
        id: pago.ID_Pago,
        message: "Pago guardado correctamente"
      });
    }

    if (resource === "metas") {
      const meta = createMeta_(payload.data || {});
      return jsonOutput({
        success: true,
        id: meta.ID_Meta,
        message: "Meta creada correctamente"
      });
    }

    if (resource === "aportes_metas") {
      const aporte = createAporteMeta_(payload.data || {});
      return jsonOutput({
        success: true,
        id: aporte.ID_Aporte,
        montoAhorradoActual: aporte.Monto_Ahorrado_Actual,
        message: "Aporte registrado correctamente"
      });
    }

    if (resource === "eliminar_meta") {
      const resultado = eliminarMeta_(payload.data || {});
      return jsonOutput({
        success: true,
        message: resultado
      });
    }

    return jsonOutput({ error: "Operacion no soportada: " + resource }, 400);
  } catch (error) {
    console.error("doPost error:", error.message, error.stack);
    return jsonOutput({ error: error.message }, 500);
  }
}

function inicializarHojas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = [
    {
      nombre: SHEET_NAMES.usuarios,
      headers: ["ID_Usuario", "Nombre_Completo", "Correo", "Fecha_Creacion", "Activo"]
    },
    {
      nombre: SHEET_NAMES.gastos,
      headers: [
        "ID_Gasto", "ID_Usuario", "Fecha", "Concepto", "Categoria", "Monto",
        "Ruta_Factura", "Metodo_Pago", "Observaciones", "Mes_Anio", "Quincena"
      ]
    },
    {
      nombre: SHEET_NAMES.pagos,
      headers: [
        "ID_Pago", "ID_Usuario", "Nombre_Servicio", "Categoria", "Dia_Vence",
        "Monto_Estimado", "Estado", "Ultimo_Pago_Fecha", "Recordatorio_Activo"
      ]
    },
    {
      nombre: SHEET_NAMES.categorias,
      headers: ["ID_Categoria", "Nombre_Categoria", "Icono", "Activa"]
    },
    {
      nombre: SHEET_NAMES.metas,
      headers: [
        "ID_Meta", "ID_Usuario", "Nombre_Meta", "Categoria", "Monto_Objetivo",
        "Monto_Ahorrado", "Fecha_Limite", "Descripcion", "Estado", "Fecha_Creacion"
      ]
    },
    {
      nombre: SHEET_NAMES.aportesMetas,
      headers: ["ID_Aporte", "ID_Meta", "ID_Usuario", "Monto_Aporte", "Fecha_Aporte", "Notas"]
    }
  ];

  const categoriasIniciales = [
    ["CAT001", "Alimentacion", "restaurant", true],
    ["CAT002", "Servicios", "bolt", true],
    ["CAT003", "Ocio", "mood", true],
    ["CAT004", "Transporte", "directions_car", true],
    ["CAT005", "Salud", "favorite", true]
  ];

  const usuariosIniciales = [
    ["jefferson", "Jefferson Rojas", "", Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), true],
    ["juliana", "Juliana González", "", Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"), true]
  ];

  let creadas = 0;
  hojas.forEach(function(hojaConfig) {
    let hoja = ss.getSheetByName(hojaConfig.nombre);
    if (!hoja) {
      hoja = ss.insertSheet(hojaConfig.nombre);
      hoja.appendRow(hojaConfig.headers);
      hoja.setFrozenRows(1);
      creadas++;
    }

    if (hojaConfig.nombre === SHEET_NAMES.categorias) {
      const data = hoja.getDataRange().getValues();
      if (data.length <= 1) {
        categoriasIniciales.forEach(function(row) { hoja.appendRow(row); });
      }
    }

    if (hojaConfig.nombre === SHEET_NAMES.usuarios) {
      const data = hoja.getDataRange().getValues();
      if (data.length <= 1) {
        usuariosIniciales.forEach(function(row) { hoja.appendRow(row); });
      }
    }
  });

  return "Hojas inicializadas: " + creadas + " creadas. Usuarios y categorías por defecto incluidos.";
}

function filterByUser_(rows, usuarioId, columnName) {
  if (!usuarioId) return rows;
  return rows.filter(function(row) {
    return String(row[columnName] || "") === String(usuarioId);
  });
}

function readTable_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1).filter(hasData_).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function hasData_(row) {
  return row.some(function(cell) {
    return cell !== "" && cell !== null;
  });
}

function resolveUserId_(data) {
  let id = data.usuario || data.idUsuario || data.ID_Usuario || data.id_usuario || "";
  id = String(id).trim();
  if (!id) {
    id = "jefferson";
  }
  return id;
}

function createExpense_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.gastos);
  if (!sheet) {
    throw new Error("No existe la hoja de gastos");
  }

  const now = new Date();
  const expenseDate = data.fecha ? new Date(data.fecha) : now;
  const facturaUrl = saveInvoiceFile_(data);
  const idUsuario = resolveUserId_(data);

  const expense = {
    ID_Gasto: data.id || createId_("G"),
    ID_Usuario: idUsuario,
    Fecha: Utilities.formatDate(expenseDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
    Concepto: data.concepto || "",
    Categoria: data.categoria || "",
    Monto: Number(data.monto || 0),
    Ruta_Factura: facturaUrl || data.factura || "",
    Metodo_Pago: data.metodo || "",
    Observaciones: data.observaciones || "",
    Mes_Anio: data.mesAnio || Utilities.formatDate(expenseDate, Session.getScriptTimeZone(), "MM/yyyy"),
    Quincena: data.quincena || getFortnight_(expenseDate)
  };

  sheet.appendRow([
    expense.ID_Gasto,
    expense.ID_Usuario,
    expense.Fecha,
    expense.Concepto,
    expense.Categoria,
    expense.Monto,
    expense.Ruta_Factura,
    expense.Metodo_Pago,
    expense.Observaciones,
    expense.Mes_Anio,
    expense.Quincena
  ]);

  return expense;
}

function createCategory_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.categorias);
  if (!sheet) {
    throw new Error("No existe la hoja de categorias");
  }

  const categoryName = String(data.nombre || "").trim();
  if (!categoryName) {
    throw new Error("El nombre de la categoria es obligatorio");
  }

  const existingCategories = readTable_(SHEET_NAMES.categorias);
  const exists = existingCategories.some(function(item) {
    return String(item.Nombre_Categoria || "").trim().toLowerCase() === categoryName.toLowerCase();
  });

  if (exists) {
    throw new Error("Esa categoria ya existe");
  }

  const category = {
    ID_Categoria: data.id || createId_("CAT"),
    Nombre_Categoria: categoryName,
    Icono: data.icono || "",
    Activa: data.activa !== false
  };

  sheet.appendRow([
    category.ID_Categoria,
    category.Nombre_Categoria,
    category.Icono,
    category.Activa
  ]);

  return category;
}

function createPago_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.pagos);
  if (!sheet) {
    throw new Error("No existe la hoja: " + SHEET_NAMES.pagos);
  }

  const idUsuario = resolveUserId_(data);

  const pago = {
    ID_Pago: data.id || createId_("P"),
    ID_Usuario: idUsuario,
    Nombre_Servicio: data.servicio || data.Nombre_Servicio || "",
    Categoria: data.categoria || "",
    Dia_Vence: Number(data.diaVence || data.Dia_Vence || 1),
    Monto_Estimado: Number(data.montoEstimado || data.Monto_Estimado || 0),
    Estado: data.estado || data.Estado || "Pendiente",
    Ultimo_Pago_Fecha: data.ultimoPago || data.Ultimo_Pago_Fecha || "",
    Recordatorio_Activo: data.recordatorio !== undefined ? data.recordatorio : true
  };

  sheet.appendRow([
    pago.ID_Pago,
    pago.ID_Usuario,
    pago.Nombre_Servicio,
    pago.Categoria,
    pago.Dia_Vence,
    pago.Monto_Estimado,
    pago.Estado,
    pago.Ultimo_Pago_Fecha,
    pago.Recordatorio_Activo
  ]);

  return pago;
}

function createMeta_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.metas);
  if (!sheet) {
    throw new Error("No existe la hoja: " + SHEET_NAMES.metas);
  }

  const idUsuario = resolveUserId_(data);
  const now = new Date();

  const meta = {
    ID_Meta: data.id || createId_("META"),
    ID_Usuario: idUsuario,
    Nombre_Meta: String(data.nombre || data.Nombre_Meta || "").trim(),
    Categoria: data.categoria || "Otros",
    Monto_Objetivo: Number(data.montoObjetivo || data.Monto_Objetivo || 0),
    Monto_Ahorrado: Number(data.montoAhorrado || data.Monto_Ahorrado || 0),
    Fecha_Limite: data.fechaLimite || data.Fecha_Limite || "",
    Descripcion: data.descripcion || data.Descripcion || "",
    Estado: data.estado || data.Estado || "Activa",
    Fecha_Creacion: Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd")
  };

  if (!meta.Nombre_Meta) {
    throw new Error("El nombre de la meta es obligatorio");
  }
  if (meta.Monto_Objetivo <= 0) {
    throw new Error("El monto objetivo debe ser mayor a cero");
  }

  sheet.appendRow([
    meta.ID_Meta,
    meta.ID_Usuario,
    meta.Nombre_Meta,
    meta.Categoria,
    meta.Monto_Objetivo,
    meta.Monto_Ahorrado,
    meta.Fecha_Limite,
    meta.Descripcion,
    meta.Estado,
    meta.Fecha_Creacion
  ]);

  return meta;
}

function createAporteMeta_(data) {
  const sheetAportes = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.aportesMetas);
  const sheetMetas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.metas);
  if (!sheetAportes) throw new Error("No existe la hoja: " + SHEET_NAMES.aportesMetas);
  if (!sheetMetas) throw new Error("No existe la hoja: " + SHEET_NAMES.metas);

  const metaId = String(data.idMeta || data.ID_Meta || "").trim();
  const montoAporte = Number(data.monto || data.montoAporte || data.Monto_Aporte || 0);
  const idUsuario = resolveUserId_(data);
  const now = new Date();

  if (!metaId) throw new Error("ID_Meta es obligatorio para registrar un aporte");
  if (montoAporte <= 0) throw new Error("El monto del aporte debe ser mayor a cero");

  const metasRows = sheetMetas.getDataRange().getValues();
  const metaHeaders = metasRows[0];
  const idxMetaId = metaHeaders.indexOf("ID_Meta");
  const idxAhorrado = metaHeaders.indexOf("Monto_Ahorrado");
  const idxObjetivo = metaHeaders.indexOf("Monto_Objetivo");
  const idxEstado = metaHeaders.indexOf("Estado");

  let filaMeta = -1;
  let nuevoAhorrado = 0;
  for (let i = 1; i < metasRows.length; i++) {
    if (String(metasRows[i][idxMetaId]) === metaId) {
      filaMeta = i + 1;
      const actual = Number(metasRows[i][idxAhorrado] || 0);
      const objetivo = Number(metasRows[i][idxObjetivo] || 0);
      nuevoAhorrado = Math.min(objetivo, actual + montoAporte);
      sheetMetas.getRange(filaMeta, idxAhorrado + 1).setValue(nuevoAhorrado);

      if (objetivo > 0 && nuevoAhorrado >= objetivo) {
        sheetMetas.getRange(filaMeta, idxEstado + 1).setValue("Completada");
      }
      break;
    }
  }

  if (filaMeta === -1) {
    throw new Error("No se encontró la meta con ID: " + metaId);
  }

  const aporte = {
    ID_Aporte: createId_("AP"),
    ID_Meta: metaId,
    ID_Usuario: idUsuario,
    Monto_Aporte: montoAporte,
    Fecha_Aporte: Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd"),
    Notas: data.notas || data.Notas || ""
  };

  sheetAportes.appendRow([
    aporte.ID_Aporte,
    aporte.ID_Meta,
    aporte.ID_Usuario,
    aporte.Monto_Aporte,
    aporte.Fecha_Aporte,
    aporte.Notas
  ]);

  aporte.Monto_Ahorrado_Actual = nuevoAhorrado;
  return aporte;
}

function eliminarMeta_(data) {
  const sheetMetas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.metas);
  const sheetAportes = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.aportesMetas);
  if (!sheetMetas) throw new Error("No existe la hoja: " + SHEET_NAMES.metas);

  const metaId = String(data.idMeta || data.ID_Meta || data.id || "").trim();
  if (!metaId) throw new Error("ID_Meta es obligatorio para eliminar");

  const metasRows = sheetMetas.getDataRange().getValues();
  const metaHeaders = metasRows[0];
  const idxMetaId = metaHeaders.indexOf("ID_Meta");

  let filaMeta = -1;
  for (let i = 1; i < metasRows.length; i++) {
    if (String(metasRows[i][idxMetaId]) === metaId) {
      filaMeta = i;
      break;
    }
  }

  if (filaMeta === -1) {
    throw new Error("No se encontró la meta con ID: " + metaId);
  }

  sheetMetas.deleteRow(filaMeta + 1);

  if (sheetAportes) {
    const aportesRows = sheetAportes.getDataRange().getValues();
    if (aportesRows.length > 1) {
      const aporteHeaders = aportesRows[0];
      const idxAporteMetaId = aporteHeaders.indexOf("ID_Meta");
      for (let i = aportesRows.length - 1; i >= 1; i--) {
        if (String(aportesRows[i][idxAporteMetaId]) === metaId) {
          sheetAportes.deleteRow(i + 1);
        }
      }
    }
  }

  return "Meta y sus aportes eliminados correctamente";
}

function createId_(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, "").substring(0, 10).toUpperCase();
}

function saveInvoiceFile_(data) {
  const fileData = data.facturaArchivo;
  if (!fileData || !fileData.base64) {
    return "";
  }

  const folder = getInvoiceFolder_();
  const contentType = fileData.mimeType || "application/octet-stream";
  const extension = getFileExtension_(fileData.name, contentType);
  const fileName = [data.id || createId_("F"), data.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")]
    .join("_") + extension;

  const blob = Utilities.newBlob(
    Utilities.base64Decode(fileData.base64),
    contentType,
    fileName
  );
  const file = folder.createFile(blob);

  return file.getUrl();
}

function getInvoiceFolder_() {
  if (!DRIVE_FOLDER_ID) {
    throw new Error("Configura DRIVE_FOLDER_ID para guardar facturas en Google Drive");
  }

  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

function getFileExtension_(fileName, mimeType) {
  if (fileName && fileName.indexOf(".") !== -1) {
    return "." + fileName.split(".").pop();
  }

  if (mimeType === "application/pdf") {
    return ".pdf";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  return "";
}

function getFortnight_(dateValue) {
  return dateValue.getDate() <= 15 ? "Primera Quincena" : "Segunda Quincena";
}

function jsonOutput(payload, statusCode) {
  const json = JSON.stringify({
    status: statusCode || 200,
    ...payload
  });

  const output = ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}

function doOptions(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
