# Control de Gastos

Maqueta `HTML/CSS/JS` para una aplicacion personal de gastos, inspirada en `AppSheet` y pensada para usar `Google Sheets` como base de datos mediante `Google Apps Script`.

## Archivos

- `index.html`: interfaz principal
- `styles.css`: estilos responsivos
- `script.js`: carga datos, renderiza paneles y registra gastos
- `config.js`: contiene la URL del Web App de Google Apps Script
- `google-apps-script.gs`: backend para leer y escribir en Google Sheets

## Estructura de Google Sheets

Crea un archivo de Google Sheets con estas hojas y encabezados:

### Hoja `Gastos`

```text
ID_Gasto | Fecha | Concepto | Categoria | Monto | Ruta_Factura | Metodo_Pago | Observaciones | Mes_Anio | Quincena
```

### Hoja `Calendario_Pagos`

```text
ID_Pago | Nombre_Servicio | Categoria | Dia_Vence | Monto_Estimado | Estado | Ultimo_Pago_Fecha | Recordatorio_Activo
```

### Hoja `Categorias`

```text
ID_Categoria | Nombre_Categoria | Icono | Activa
```

## Como conectar con Google Sheets

1. Abre tu archivo de `Google Sheets`.
2. En el menu, entra a `Extensiones > Apps Script`.
3. Crea un proyecto nuevo y pega el contenido de `google-apps-script.gs`.
4. Guarda el proyecto.
5. Dentro del script, configura el ID de la carpeta de `Google Drive` donde se guardaran las facturas:

```js
const DRIVE_FOLDER_ID = "TU_FOLDER_ID";
```

Puedes obtener ese ID desde la URL de la carpeta en Drive.

6. En `Implementar > Nueva implementacion`, elige `Aplicacion web`.
7. Configura:
   - Ejecutar como: `Tu cuenta`
   - Quien tiene acceso: `Cualquiera con el enlace`
8. Copia la URL generada del Web App.
9. Abre `config.js` y pega la URL:

```js
window.APP_CONFIG = {
  apiBaseUrl: "TU_URL_DEL_WEB_APP"
};
```

10. Recarga la pagina.

## Como probar localmente

Si aun no has configurado el Web App, la app funciona en `modo demo`.

Para abrir el proyecto local:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://127.0.0.1:8000/
```

## Que hace el backend

- `GET ?resource=bootstrap`: devuelve categorias, gastos y pagos
- `GET ?resource=gastos`: devuelve solo gastos
- `GET ?resource=pagos`: devuelve solo pagos
- `GET ?resource=categorias`: devuelve solo categorias
- `POST`: guarda un nuevo gasto en la hoja `Gastos`
- Si envias un archivo en base64, tambien lo guarda en `Google Drive` y registra la URL en `Ruta_Factura`

## Flujo de facturas

- El navegador lee la factura seleccionada y la convierte a `base64`
- El frontend la envia junto con el gasto al Web App de `Apps Script`
- `Apps Script` crea el archivo dentro de la carpeta de `Google Drive`
- Luego guarda en la hoja `Gastos` la URL del archivo creado

## Importante sobre CORS

- Si abres esta maqueta desde `localhost`, es posible que el navegador bloquee las llamadas a `Google Apps Script` por una restriccion de `CORS`
- Si ocurre, veras que la app sigue funcionando en `modo demo`
- Para evitar ese problema, una buena siguiente mejora es servir el frontend desde `Apps Script` o moverlo a un despliegue compatible con tu backend

## Notas

- Si no hay `apiBaseUrl`, el frontend usa datos simulados.
- El campo de factura ahora puede guardar la URL real del archivo si `Apps Script` y `Drive` estan configurados.
- Si quieres, la siguiente fase puede ser:
  - editar y eliminar gastos
  - filtros reales por mes, categoria y quincena
  - dashboard con graficos mas avanzados
  - servir toda la app desde `Google Apps Script` para evitar `CORS`
