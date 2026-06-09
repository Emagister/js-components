# Emagister JS Components Library

Una librería de componentes reutilizables en Javascript para proyectos de Emagister, diseñada con un enfoque en modularidad, personalización y carga perezosa (Lazy Loading).

## Instalación

```bash
npm install @emagister/js-components
```

La librería tiene **peer dependencies** opcionales según los componentes que uses:

```bash
# Para componentes Bootstrap (Modal, Tooltip, Dropdown, Confirm, MessageToast)
npm install bootstrap bootstrap-icons

# Para DatePicker
npm install flatpickr

# Para RichTextEditor
npm install @tiptap/core @tiptap/starter-kit

# Para RichMultiSelect
npm install tom-select
```

## Uso Principal: ComponentManager

La forma más eficiente de usar la librería es a través de la clase `ComponentManager`. Esta clase gestiona automáticamente la detección de componentes en el HTML e importa dinámicamente solo el código necesario (Lazy Loading).

### 1. Inicialización en JS

```javascript
import { ComponentManager } from '@emagister/js-components';

// Opción A: Uso Rápido (CSS estático)
import '@emagister/js-components/style.css';

// Opción B: Uso Personalizado (Recomendado - ver sección Personalización abajo)
// import './estilos-proyecto.scss'; 

const app = new ComponentManager();
app.start();
```

### 2. Uso en HTML

Solo tienes que añadir el atributo `data-component` a tus elementos HTML. La librería detectará el componente y lo inicializará automáticamente.

```html
<!-- Ejemplo de Tabla con carga perezosa -->
<div data-component="data-table"
     data-url="/api/data"
     data-columns='[{"key":"id", "label":"ID", "width":"80px"}, {"key":"name", "label":"Nombre", "sortable":true}]'
     data-settings='{ "perPage": 10, "sortBy": "name", "sortOrder": "desc" }'>
</div>

<!-- Ejemplo de Tooltip -->
<button data-component="tooltip" title="¡Soy un tooltip!">
  Hover me
</button>
```

## Componentes Disponibles y Configuración

Todos los componentes se activan añadiendo `data-component="<nombre>"` al elemento HTML. La configuración se puede pasar mediante `data-settings='{"opcion": valor}'` o en algunos componentes directamente como atributos `data-*`.

### `data-table`
Tabla dinámica con paginación y ordenación. Al inicializarse, el componente añade automáticamente la clase `data-table-container` al elemento raíz, que es la que activa todos sus estilos CSS.

Atributos HTML:
- `data-url` (String): URL de la API que devuelve los datos.
- `data-columns` (JSON): Definición de columnas (ver más abajo).
- `data-actions` (JSON): Definición de acciones (ver más abajo).
- `data-settings` (JSON): Configuración adicional.

Opciones en `data-settings`:
- `perPage` (Number, default: 10): Filas por página.
- `filterForm` (Object): Configuración recomendada del formulario de filtros:
  - `id` (String): ID del formulario que filtra la tabla. Al hacer submit se recogen los valores del formulario y se aplican como filtros a la petición.
  - `resetButtonId` (String, opcional): ID del botón que limpia los filtros. Al hacer click resetea el formulario y elimina todos los filtros activos, volviendo a la primera página.
  - **Retrocompatibilidad:** `filterFormId` en `data-settings` y el atributo HTML `data-filterForm` siguen siendo equivalentes a `filterForm.id`. Se recomienda migrar a la nueva sintaxis `filterForm`; las opciones antiguas se mantienen solo por compatibilidad.
- `sortBy` (String): Columna por la que ordenar inicialmente.
- `sortOrder` (String: `'asc'`|`'desc'`): Dirección del orden inicial.
- `striped` (Boolean, default: false): Activa/desactiva el estilo de filas alternas.
- `hover` (Boolean, default: true): Activa/desactiva el efecto hover en filas.
- `headerClass` (String): Clases CSS aplicadas al `<tr>` del encabezado.
- `scrollOffset` (Number, default: 0): Desplazamiento en píxeles al hacer scroll al paginar. Útil para compensar navbars fijos.
- `bulkDeleteUrl` (String, default: `null`): URL del endpoint para la eliminación masiva de registros. **Si no se indica, la funcionalidad queda completamente desactivada** (no aparecen checkboxes ni el botón de eliminar). Cuando está activo, se añade una columna de checkboxes al inicio de la tabla y un botón "Eliminar seleccionados" al pie. Al pulsar el botón, se envía `POST` a esta URL con `{ ids: ["1", "2", ...] }` como cuerpo JSON. Tras la respuesta exitosa, la tabla se refresca automáticamente.
- `pageSizeOptions` (Array, default: `[10, 25, 50, 100]`): Opciones disponibles en el selector de filas por página. Se renderiza como un `<select>` junto al contador de resultados. El valor activo en cada momento refleja el `perPage` en uso. Al cambiar la selección, la tabla vuelve a la primera página y lanza una nueva petición. Para ocultar el selector, pasa un array vacío: `[]` (en ese caso no se añade `perPage` automáticamente). Si el array no está vacío y el valor de `perPage` no está incluido, se añade automáticamente en la posición ordenada correcta.
- `actionsWidth` (String, default: `'80px'`): Ancho fijo de la columna de acciones (cualquier valor CSS válido: `px`, `%`, `em`, etc.). Se genera automáticamente un `<colgroup>` con el ancho indicado para dicha columna, aunque ninguna columna de datos tenga `width`.
- `fetchOnInit` (Boolean, default: `true`): Controla si el componente realiza la petición inicial al cargar. Ponlo a `false` para que la tabla permanezca vacía hasta que el usuario interactúe con el formulario de búsqueda.
- `disabledRow` (String, default: `null`): Nombre del campo en cada fila que indica si debe mostrarse como desactivada. Cuando el valor del campo es truthy, el `<tr>` recibe la clase `datatable-row--disabled`, que aplica opacidad reducida y desactiva los eventos de ratón. Ejemplo: con `"disabledRow": "is_inactive"`, cualquier fila cuyo campo `is_inactive` sea `true` se renderizará visualmente atenuada. Para lógica invertida (campo que indica que el registro está activo), añade el prefijo `!`: con `"disabledRow": "!is_active"`, las filas cuyo campo `is_active` sea falsy se mostrarán desactivadas.
- `labels` (Object): Textos del componente. Permite traducir o personalizar todos los literales:
  - `total` (String, default: `'Mostrando {from} - {to} de {total} resultados'`): Contador de resultados mostrado sobre la paginación. Soporta los placeholders `{from}`, `{to}` y `{total}`, que se sustituyen automáticamente con el rango de la página actual y el total de registros.
  - `noResults` (String, default: `'No se encontraron resultados.'`): Mensaje cuando la respuesta devuelve datos vacíos.
  - `error` (String, default: `'Ocurrió un error al cargar los datos.'`): Mensaje cuando la petición a la API falla.
  - `previous` (String, default: `'Anterior'`): Texto del botón anterior de la paginación.
  - `next` (String, default: `'Siguiente'`): Texto del botón siguiente de la paginación.
  - `actions` (String, default: `'Acciones'`): Texto del encabezado de la columna de acciones.
  - `bulkDelete` (String, default: `'Eliminar seleccionados'`): Texto del botón de eliminación masiva. El número de elementos seleccionados se añade automáticamente entre paréntesis.
  - `perPage` (String, default: `'Filas por página:'`): Etiqueta del selector de elementos por página.

Ejemplo con formulario de filtros y botón de reset:
```html
<form id="my-filters">
  <input type="text" name="q" placeholder="Buscar...">
  <button type="submit">Filtrar</button>
  <button type="button" id="my-filters-reset">Limpiar</button>
</form>

<div data-component="data-table"
     data-url="/api/users"
     data-columns='[{"key":"name","label":"Nombre"}]'
     data-settings='{ "filterForm": { "id": "my-filters", "resetButtonId": "my-filters-reset" } }'>
</div>
```

Ejemplo con eliminación masiva activada:
```html
<div data-component="data-table"
     data-url="/api/users"
     data-columns='[{"key":"name","label":"Nombre"},{"key":"email","label":"Email"}]'
     data-settings='{ "bulkDeleteUrl": "/api/users/bulk-delete" }'>
</div>
```

El servidor recibirá una petición `DELETE /api/users/bulk-delete` con el siguiente cuerpo:
```json
{ "ids": ["3", "7", "12"] }
```

Tabla con búsqueda diferida (`fetchOnInit: false`): la tabla no carga datos hasta que el usuario envía el formulario. Ideal cuando la búsqueda debe ser siempre explícita:
```html
<form id="search-form">
  <input type="text" name="q" placeholder="Escribe tu búsqueda...">
  <button type="submit">Buscar</button>
  <button type="button" id="search-reset">Limpiar</button>
</form>

<div data-component="data-table"
     data-url="/api/users"
     data-columns='[{"key":"name","label":"Nombre"}]'
     data-settings='{
       "fetchOnInit": false,
       "filterForm": { "id": "search-form", "resetButtonId": "search-reset" }
     }'>
</div>
```

Ejemplo de personalización de labels en inglés y selector de página reducido:
```html
<div data-component="data-table"
     data-url="/api/items"
     data-columns='[{"key":"name","label":"Name"}]'
     data-settings='{
       "pageSizeOptions": [10, 25, 50],
       "labels": {
         "total": "Showing {from} - {to} of {total} results",
         "noResults": "No results found.",
         "error": "Failed to load data.",
         "previous": "Previous",
         "next": "Next",
         "actions": "Actions",
         "bulkDelete": "Delete selected",
         "perPage": "Rows per page:"
       }
     }'>
</div>
```

Propiedades de `data-columns` (array de objetos):
- `key` (String): Clave del campo en los datos.
- `label` (String): Texto del encabezado.
- `sortable` (Boolean): Activa la ordenación por esta columna. Al hacer click en la cabecera el ordenamiento cicla en tres estados: **ascendente → descendente → reset** (sin orden activo). Las cabeceras ordenables muestran siempre dos flechas indicadoras: la activa se resalta en color y la inactiva queda atenuada; en estado reset ambas flechas aparecen en gris.
- `headerClass` (String): Clases CSS aplicadas al `<th>` de esta columna.
- `link` (String): Clave del campo que contiene la URL para enlazar el valor.
- `badge` (String): Clave del campo que determina el nivel del badge Bootstrap.
- `width` (String): Ancho de la columna (cualquier valor CSS válido: `px`, `%`, `em`, etc.). Si al menos una columna define `width`, se genera un `<colgroup>` para controlar los anchos.

Propiedades de `data-actions` (array de objetos), renderizadas como iconos con tooltip:
- `name` (String): Identificador de la acción, disponible en el evento `datatable:action`.
- `label` (String): Texto del tooltip.
- `icon` (String): Clase del icono Bootstrap Icons (ej: `bi bi-pencil`).
- `states` (Array): Estados condicionales. Cada estado admite `key` (campo del row que lo activa), `label` e `icon`.
- `activeOnDisabledRow` (Boolean, default: `false`): Si es `true`, el botón de esta acción permanece interactivo aunque la fila esté marcada como desactivada (recibe la clase `datatable-action--active-on-disabled` que restaura `pointer-events`). Útil para incluir un botón de "Activar" en filas deshabilitadas.

Ejemplo de uso con `disabledRow` y acción de activación:
```json
"disabledRow": "is_inactive"
```
```json
[
  { "name": "edit",     "label": "Editar",  "icon": "bi bi-pencil" },
  { "name": "activate", "label": "Activar", "icon": "bi bi-check-circle", "activeOnDisabledRow": true }
]
```

La API devuelta por el servidor debe tener el formato: `{ data: [...], meta: { page, total, perPage } }`.

Eventos emitidos por el componente:
- `emg-jsc:datatable:action` — al pulsar un botón de acción. `detail: { action, id, row }`.
- `emg-jsc:datatable:bulk-delete:success` — tras una eliminación masiva exitosa. `detail: { count }` (número de registros eliminados).
- `emg-jsc:datatable:bulk-delete:error` — si el endpoint de eliminación masiva responde con error. `detail: { error }`.
- `emg-jsc:datatable:fetch:unauthorized` — cuando el servidor responde con HTTP 401. `detail: { status: 401 }`. El componente muestra el mensaje de error habitual además de emitir este evento.
- `emg-jsc:datatable:fetch:redirect` — cuando el servidor redirige la petición (p.ej. a una página de login tras expirar la sesión). `detail: { url }` donde `url` es la URL de destino de la redirección. El componente muestra el mensaje de error habitual además de emitir este evento.

Ejemplo de gestión de sesión caducada:
```javascript
const table = document.querySelector('[data-component="data-table"]');

table.addEventListener('emg-jsc:datatable:fetch:unauthorized', () => {
    window.location.href = '/login';
});

table.addEventListener('emg-jsc:datatable:fetch:redirect', (e) => {
    // e.detail.url contiene la URL de destino de la redirección (p.ej. la página de login)
    window.location.href = e.detail.url;
});
```

Ejemplo de escucha de eventos de eliminación masiva:
```javascript
document.querySelector('[data-component="data-table"]').addEventListener('emg-jsc:datatable:bulk-delete:success', (e) => {
    console.log(`${e.detail.count} registros eliminados`);
});
```

### `async-form`
Convierte un formulario HTML en un formulario asíncrono con validación y feedback.

Atributos HTML:
- `action` (String): URL del endpoint (atributo estándar del `<form>`).
- `method` (String): Método HTTP: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`.
- `data-toast-target` (String): Selector CSS del `message-toast` donde mostrar el feedback. Si se omite, se usa el toast global.

Opciones en `data-settings`:
- `messageDuration` (Number, default: 3000): Duración del toast de éxito/error en ms.

El servidor debe responder con JSON. En caso de error de validación (HTTP 4XX), puede devolver `{ error: { status: 4XX, message: "mensaje", params: { campo1: "mensaje1", campo2: "mensaje2" } } }` para mostrar errores por campo.

### `message-toast`
Sistema de notificaciones tipo toast.

Atributos HTML:
- `data-mode` (String: `'global'`|`'local'`, default: `'global'`): En modo global escucha el evento `toast:show` en `window`. En modo local solo responde a llamadas directas vía `root.messageToast.show()`.
- `data-duration` (Number, default: 3000): Tiempo visible en ms. Usa `-1` para no cerrar automáticamente.

Para mostrar un toast globalmente desde JS:
```javascript
window.dispatchEvent(new CustomEvent('toast:show', {
  detail: { message: 'Texto', type: 'success' } // type: success | error | warning | info
}));
```

### `datepicker`
Selector de fechas basado en Flatpickr. Detecta automáticamente el idioma del navegador.

Opciones en `data-settings`:
- `dateFormat` (String, default: `'Y-m-d'`): Formato del valor enviado al servidor.
- `altInput` (Boolean, default: true): Muestra un campo visual separado del campo real.
- `altFormat` (String, default: `'Y-m-d'`): Formato visual mostrado al usuario.
- `allowInput` (Boolean, default: true): Permite escribir la fecha manualmente.
- *Cualquier opción nativa de Flatpickr* (ej: `minDate`, `maxDate`).

### `loader`
Overlay de carga con spinner, posicionado sobre su elemento contenedor.

No requiere configuración. Se puede controlar mediante eventos:
```javascript
element.dispatchEvent(new CustomEvent('loader:show'));
element.dispatchEvent(new CustomEvent('loader:hide'));
```

### `modal`
Wrapper del componente Modal de Bootstrap. Expone la API en `element.modal`: `show()`, `hide()`.

### `confirm`
Diálogo de confirmación reutilizable. Requiere la siguiente estructura HTML:

```html
<div data-component="confirm" class="modal fade" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 data-confirm-title>Confirmar</h5>
      </div>
      <div class="modal-body" data-confirm-message>¿Estás seguro?</div>
      <div class="modal-footer">
        <button data-cancel-btn>Cancelar</button>
        <button data-confirm-btn>Aceptar</button>
      </div>
    </div>
  </div>
</div>
```

Uso desde JS:
```javascript
const confirmed = await window.confirmCustom('¿Eliminar este elemento?', 'Confirmar eliminación');
if (confirmed) { /* ... */ }
```

### `rich-text-editor`
Editor de texto enriquecido basado en [TipTap](https://tiptap.dev). Permite editar HTML básico con barra de herramientas de formato.

**Peer dependencies requeridas**: `@tiptap/core ^3.0.0` y `@tiptap/starter-kit ^3.0.0` (el mark `Link` está incluido en StarterKit v3).

```bash
npm install @tiptap/core @tiptap/starter-kit
```

Uso básico en formulario (sincroniza automáticamente el HTML generado al `textarea`):
```html
<div data-component="rich-text-editor">
  <textarea name="body"><p>Contenido inicial</p></textarea>
</div>
```

Uso standalone (sin formulario):
```html
<div data-component="rich-text-editor" id="my-editor">
</div>
```

Opciones en `data-settings`:
- `toolbar` (Array|null, default: `null`): Lista de acciones visibles en la barra de herramientas. `null` muestra todas. Los separadores se ajustan automáticamente (no aparecen al inicio, al final ni consecutivos).

  Acciones disponibles: `toggleBold`, `toggleItalic`, `toggleStrike`, `toggleHeadingH2`, `toggleHeadingH3`, `toggleBulletList`, `toggleOrderedList`, `toggleBlockquote`, `toggleCodeBlock`, `toggleLink`, `undo`, `redo`.

  > Para `toggleHeading`, usa las claves `toggleHeadingH2` / `toggleHeadingH3` al especificar el toolbar.

  ```html
  <!-- Solo negrita, cursiva y deshacer/rehacer -->
  <div data-component="rich-text-editor"
       data-settings='{"toolbar": ["toggleBold", "toggleItalic", "undo", "redo"]}'>
    <textarea name="body"></textarea>
  </div>
  ```

- `labels` (Object): Permite personalizar los textos de los tooltips de la barra de herramientas. Solo es necesario indicar las claves que se quieren sobreescribir; el resto mantiene los valores por defecto en español.

  Claves disponibles y valores por defecto:
  | Clave | Valor por defecto |
  |---|---|
  | `toggleBold` | `Negrita` |
  | `toggleItalic` | `Cursiva` |
  | `toggleStrike` | `Tachado` |
  | `toggleHeadingH2` | `Título 2` |
  | `toggleHeadingH3` | `Título 3` |
  | `toggleBulletList` | `Lista` |
  | `toggleOrderedList` | `Lista ordenada` |
  | `toggleBlockquote` | `Cita` |
  | `toggleCodeBlock` | `Bloque de código` |
  | `toggleLink` | `Enlace` |
  | `linkPrompt` | `Introduce la URL:` |
  | `undo` | `Deshacer` |
  | `redo` | `Rehacer` |

  ```html
  <div data-component="rich-text-editor"
       data-settings='{
         "labels": {
           "toggleBold": "Bold",
           "toggleItalic": "Italic",
           "undo": "Undo",
           "redo": "Redo"
         }
       }'>
    <textarea name="body"></textarea>
  </div>
  ```

- `link` (Object): Configuración de la extensión de enlaces. Todas las opciones relacionadas con links se agrupan aquí.
  - `openOnClick` (Boolean, default: `false`): Si es `true`, los enlaces son clicables directamente en el editor.
  - `htmlAttributes` (Object, default: `{}`): Atributos HTML que TipTap añade a las etiquetas `<a>` generadas por el editor. Se pasa directamente a `Link.configure({ HTMLAttributes: ... })`. Usa `null` para eliminar un atributo que la extensión añade por defecto.

  ```html
  <!-- Los enlaces abren en la misma pestaña sin rel nofollow -->
  <div data-component="rich-text-editor"
       data-settings='{
         "link": {
           "openOnClick": false,
           "htmlAttributes": {
             "target": null,
             "rel": "noopener noreferrer"
           }
         }
       }'>
    <textarea name="body"></textarea>
  </div>
  ```

La barra de herramientas por defecto incluye: **Negrita**, *Cursiva*, ~~Tachado~~, Título H2/H3, Lista, Lista ordenada, Cita, Bloque de código, Enlace, Deshacer/Rehacer.

API expuesta en `element.richTextEditor`:
- `getHTML()` — devuelve el HTML del editor.
- `setHTML(html)` — establece el contenido.
- `focus()` — enfoca el editor.
- `destroy()` — destruye la instancia.

Evento emitido:
- `emg-jsc:richTextEditor:initialized` — cuando el editor está listo.

Ejemplo de uso programático:
```javascript
const editor = document.querySelector('[data-component="rich-text-editor"]');
editor.addEventListener('emg-jsc:richTextEditor:initialized', () => {
  console.log(editor.richTextEditor.getHTML()); // '<p></p>'
  editor.richTextEditor.setHTML('<p>Nuevo contenido</p>');
});
```

### `rich-multi-select`
Control de selección múltiple enriquecido basado en [Tom Select](https://tom-select.js.org). Muestra los ítems seleccionados como tags con botón de eliminación, soporta búsqueda en tiempo real y carga remota via AJAX.

**Peer dependency requerida**: `tom-select ^2.3`. Los estilos del tema Bootstrap 5 se incluyen automáticamente en el bundle CSS de la librería.

```bash
npm install tom-select
```

Uso básico con opciones estáticas:
```html
<select name="centers[]" multiple
        data-component="rich-multi-select"
        data-settings='{"placeholder": "Selecciona centros…", "maxItems": 3}'>
  <option value="1">Centro Madrid</option>
  <option value="2" selected>Centro Barcelona</option>
  <option value="3">Centro Valencia</option>
</select>
```

Placeholder diferenciado según haya o no ítems seleccionados:
```html
<select name="centers[]" multiple
        data-component="rich-multi-select"
        data-settings='{
          "placeholder": "Selecciona centros…",
          "placeholderWithItems": "Añadir más centros…"
        }'>
  <option value="1">Centro Madrid</option>
  <option value="2">Centro Barcelona</option>
</select>
```

Opciones en `data-settings`:

| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `placeholder` | String | `"Seleccionar…"` | Texto del input cuando no hay ningún ítem seleccionado. |
| `placeholderWithItems` | String | — | Texto alternativo del input cuando hay al menos un ítem seleccionado. Se aplica también si el `<select>` ya tiene valores preseleccionados al inicializar. Si no se define, el placeholder no cambia. |
| `clearInputOnSelect` | Boolean | `false` | Si es `true`, vacía el texto de búsqueda cada vez que se selecciona un ítem y refresca la lista de opciones. Útil en combinación con `remoteUrl` para lanzar una búsqueda nueva tras cada selección. |
| `maxItems` | Number \| null | `null` | Máximo de ítems seleccionables. `null` es ilimitado. |
| `searchField` | String | `"text"` | Campo(s) sobre los que buscar. |
| `create` | Boolean | `false` | Permite crear opciones nuevas no existentes. |
| `noResultsText` | String | `"Sin resultados"` | Mensaje cuando la búsqueda no devuelve coincidencias. |
| `remoteUrl` | String | — | Si se indica, activa la carga remota vía AJAX (ver más abajo). |
| `remoteValueField` | String | `"id"` | Campo del JSON de respuesta usado como `value`. |
| `remoteLabelField` | String | `"name"` | Campo del JSON de respuesta usado como etiqueta visible. |

Carga remota (AJAX):

Cuando se define `remoteUrl`, el componente hace `GET {remoteUrl}?q={término}` al escribir en el input. Debounce de 300 ms, mínimo 2 caracteres para activar la búsqueda.

```html
<select name="centers[]" multiple
        data-component="rich-multi-select"
        data-settings='{
          "placeholder": "Buscar centros…",
          "remoteUrl": "/api/centers/search"
        }'>
</select>
```

El servidor debe responder con un array JSON:
```json
[
  { "id": "1", "name": "Centro Madrid Norte" },
  { "id": "2", "name": "Centro Madrid Sur" }
]
```

Los campos `id` y `name` son los valores por defecto; se pueden cambiar con `remoteValueField` y `remoteLabelField`.

API expuesta en `element.richMultiSelect`:
- `getValue()` — devuelve un array con los valores seleccionados.
- `setValue(values)` — establece la selección programáticamente.
- `addOption({ value, text })` — añade una opción dinámica al control.
- `clear()` — limpia toda la selección.
- `destroy()` — destruye la instancia y restaura el `<select>` original.

```javascript
const select = document.getElementById('my-select');
select.addEventListener('emg-jsc:richMultiSelect:initialized', () => {
  select.richMultiSelect.setValue(['1', '3']);
  console.log(select.richMultiSelect.getValue()); // ['1', '3']
});
```

Eventos emitidos sobre el `<select>` original:

| Evento | Cuándo | `event.detail` |
|---|---|---|
| `emg-jsc:richMultiSelect:change` | Al añadir o eliminar un ítem | `{ values: string[] }` |
| `emg-jsc:richMultiSelect:item-add` | Al seleccionar un nuevo ítem | `{ value, text }` |
| `emg-jsc:richMultiSelect:item-remove` | Al eliminar un ítem seleccionado | `{ value }` |
| `emg-jsc:richMultiSelect:focus` | Al abrir el desplegable | — |
| `emg-jsc:richMultiSelect:blur` | Al cerrar el desplegable | — |
| `emg-jsc:richMultiSelect:load-error` | Cuando falla la carga remota (HTTP no ok o error de red) | — |
| `emg-jsc:richMultiSelect:initialized` | Cuando el componente está listo | — |

### `tooltip`
Wrapper del Tooltip de Bootstrap. Usa el atributo estándar `title` para el texto.

```html
<button data-component="tooltip" title="Texto del tooltip">Hover me</button>
```

### `dropdown`
Wrapper del Dropdown de Bootstrap. Expone la API en `element.dropdown`: `show()`, `hide()`, `toggle()`.

## Personalización de Estilos

La librería permite una personalización profunda a dos niveles:

### 1. Sistema SASS (Tiempo de compilación)

Recomendado para definir el tema base de tu aplicación. Utiliza `@use ... with` en tu archivo SCSS principal:

```scss
@use "@emagister/js-components/scss/index" with (
  $emg-brand-color: #4cb7ac,
  $emg-table-header-bg: #e7f3ff,
  $emg-table-header-color: #0056b3,
  $emg-border-color: #007bff
);
```

> **Importante**: No olvides importar este archivo `.scss` en el punto de entrada de tu JavaScript para que los estilos se procesen y se apliquen.

### 2. Variables CSS (Tiempo de ejecución)

Todos los componentes utilizan **CSS Custom Properties** que heredan de las variables SASS pero pueden ser sobreescritas en el navegador:

```css
:root {
  --emg-brand-color: #ff5722; /* Cambia el color principal del loader y otros */
  --emg-table-header-bg: #333;
}
```

## Estructura del Proyecto

- `src/components/`: Cada componente tiene su propia carpeta con su JS y su SCSS específico.
- `scss/`: Variables globales y estilos públicos para personalización por el cliente.
- `example/`: Aplicación de ejemplo completa para pruebas y referencia.

## Simulación de Backend en el Ejemplo

Dado que el ejemplo es puramente frontend, algunos componentes (`DataTable` y `AsyncForm`) utilizan una capa de simulación para interactuar con archivos JSON locales como si fueran una API real:

- **DataTable**: Carga datos desde `example/datatableData.json` y simula la paginación dinámica mediante el interceptor de peticiones.
- **AsyncForm**: Utiliza un interceptor de `fetch` en `example/js/main.js` para simular errores 422 (con feedback por campo) y éxitos mediante parámetros en la URL (ej: `?simulate-error`). Incluye retardos artificiales para visualizar los estados de carga.
- **RichMultiSelect**: El ejemplo de carga remota intercepta `GET /api/centers/search?q=` y devuelve una lista de centros filtrados con 400 ms de retardo artificial para visualizar el spinner de carga.

Esto permite probar el comportamiento de validación y los estados de carga de los componentes sin necesidad de un backend activo durante el desarrollo.

---
© 2026 Emagister Development Team
