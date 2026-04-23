---
title: RichMultiSelect (Componente JS)
version: 1.0
date: 2026-04-23
---

# RichMultiSelect

## 1. Resumen

`RichMultiSelect` es un componente JavaScript reutilizable que envuelve la librería **Tom Select** para proporcionar un control de selección múltiple enriquecido. Ofrece búsqueda textual en tiempo real, visualización de ítems seleccionados como *tags* eliminables y una API coherente con el resto de componentes.

---

## 2. Selección de Librería Base

### 2.1 Análisis de Candidatas

| Librería | Stars GitHub | Última release | Mantenimiento | Notas |
| :--- | :---: | :---: | :---: | :--- |
| **Tom Select** | ~4.5k | Activa (mensual) | ✅ Muy activo | Fork moderno de Selectize; sin jQuery; ligero (~16 kB gzip) |
| Select2 | ~25k | Activa | ⚠️ Requiere jQuery | Madura pero acoplada a jQuery; overhead innecesario |
| Choices.js | ~6k | Activa | ✅ Activo | Buena API pero menos extensible que Tom Select |
| Multiselect.js | ~1k | Inactiva | ❌ Abandonada | Descartada |

### 2.2 Decisión

Se elige **Tom Select** (`tomselect`) como dependencia base por los siguientes motivos:

- Sin dependencia de jQuery, compatible con el stack actual.
- API declarativa y extensible mediante plugins.
- Soporte nativo de búsqueda textual, renderizado de ítems personalizados y navegación por teclado.
- Comunidad activa: releases frecuentes, issues resueltos con celeridad.
- Compatible con Bootstrap 5 (tema oficial disponible).

**Versión mínima requerida:** `tom-select >= 2.3`

---

## 3. Permisos y Rutas HTTP

Este componente es puramente de UI; no expone rutas HTTP propias. Se instancia sobre elementos `<select multiple>` existentes dentro de cualquier vista.

---

## 4. Especificación del Componente

### 4.1 Ubicación de Ficheros

| Tipo | Ruta |
| :--- | :--- |
| Componente JS | `src/components/RichMultiSelect/RichMultiSelect.js` |
| Estilos override | `src/components/RichMultiSelect/_rich-multi-select.scss` |
| Test unitario | `tests/components/RichMultiSelect/RichMultiSelect.test.js` |

### 4.2 Inicialización

El componente se inicializa mediante el atributo `data-component="rich-multi-select"` sobre un `<select multiple>`. Se monta automáticamente en el bootstrap del componente.

```html
<select
  id="centers"
  name="centers[]"
  multiple
  data-component="rich-multi-select"
  data-settings='{
    "placeholder": "Buscar centros…",
    "maxItems": 10
  }'
>
  <option value="1">Centro Madrid</option>
  <option value="2" selected>Centro Barcelona</option>
</select>
```

### 4.3 Opciones de Configuración (`data-settings`)

Las opciones de configuración se engloban en un único atributo `data-settings` que contiene un objeto en formato JSON.

| Propiedad | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `placeholder` | string | `"Seleccionar…"` | Texto del input cuando no hay selección. |
| `maxItems` | number \| null | `null` (ilimitado) | Máximo de ítems seleccionables simultáneamente. |
| `searchField` | string | `"text"` | Campo(s) por los que buscar (ej. `"text,value"`). |
| `remoteUrl` | string | — | Si se indica, carga opciones por AJAX (ver §4.6). |
| `remoteValueField` | string | `"id"` | Campo del JSON usado como `value`. |
| `remoteLabelField` | string | `"name"` | Campo del JSON usado como etiqueta visible. |
| `noResultsText` | string | `"Sin resultados"` | Mensaje cuando la búsqueda no encuentra coincidencias. |
| `create` | boolean | `false` | Permite al usuario crear opciones nuevas no existentes. |

### 4.4 API Pública (JavaScript)

El componente expone su instancia en `element.richMultiSelect` para integración programática.

```javascript
const rms = document.getElementById('centers').richMultiSelect;

// Obtener valores seleccionados
rms.getValue();          // → ['1', '3']

// Establecer valores
rms.setValue(['2', '4']);

// Añadir opción dinámica
rms.addOption({ value: '99', text: 'Centro Nuevo' });

// Limpiar selección
rms.clear();

// Destruir y revertir al <select> original
rms.destroy();
```

### 4.5 Eventos

El componente emite eventos nativos sobre el `<select>` original para facilitar la integración con código existente.

| Evento | Cuándo se dispara | `event.detail` |
| :--- | :--- | :--- |
| `emg-jsc:richMultiSelect:change` | Al añadir o eliminar un ítem | `{ values: string[] }` |
| `emg-jsc:richMultiSelect:item-add` | Al seleccionar un nuevo ítem | `{ value: string, text: string }` |
| `emg-jsc:richMultiSelect:item-remove` | Al eliminar un ítem seleccionado | `{ value: string }` |
| `emg-jsc:richMultiSelect:focus` | Al abrir el desplegable | — |
| `emg-jsc:richMultiSelect:blur` | Al cerrar el desplegable | — |

### 4.6 Carga Remota (AJAX)

Cuando se define `remoteUrl` en el `data-settings`, el componente realiza peticiones `GET` al endpoint indicado enviando el término de búsqueda como parámetro `q`:

```
GET /api/centers/search?q=mad
```

Respuesta esperada (array JSON):

```json
[
  { "id": "1", "name": "Centro Madrid Norte" },
  { "id": "2", "name": "Centro Madrid Sur" }
]
```

- Debounce de **300 ms** entre pulsaciones antes de lanzar la petición.
- Mínimo de **2 caracteres** para activar la búsqueda remota.
- Mostrar spinner de carga mientras se espera respuesta.
- Manejar errores HTTP mostrando `data-no-results-text`.

---

## 5. Comportamiento Visual y UX

### 5.1 Ítems Seleccionados

- Cada ítem seleccionado se muestra como un *tag* (pastilla) dentro del propio control, antes del cursor de búsqueda.
- Cada tag incluye un botón `×` accesible que elimina el ítem al hacer clic.
- Si `maxItems` se alcanza, el input de búsqueda se deshabilita y se muestra un mensaje visual.

### 5.2 Búsqueda Textual

- La búsqueda filtra las opciones en tiempo real (client-side si las opciones están en el DOM, o server-side si hay `data-remote-url`).
- La coincidencia se resalta en negrita dentro del texto de cada opción.
- El desplegable se cierra al pulsar `Escape` o al hacer clic fuera del control.

### 5.3 Accesibilidad

- El componente cumple **WCAG 2.1 AA**: roles ARIA correctos (`combobox`, `listbox`, `option`), navegación completa por teclado (`↑ ↓` para navegar, `Enter` para seleccionar, `Backspace` para eliminar el último tag).
- Compatible con lectores de pantalla.

### 5.4 Estilos

- El tema base es `tom-select/dist/css/tom-select.bootstrap5.css`, sobrescrito con variables del proyecto en `_rich-multi-select.scss`.

---

## 6. Integración con js-components

- El componente se registra en el sistema de componentes bajo la clave `"rich-multi-select"`.
- Compatible con `MessageToast` para notificar errores de carga remota.

---

## 7. Criterios de Aceptación (Key AC)

| ID | Criterio |
| :--- | :--- |
| **AC-1** | El control renderiza los ítems seleccionados como tags con botón de eliminación visible. |
| **AC-2** | La búsqueda textual filtra las opciones en tiempo real (< 100 ms para listas ≤ 500 ítems). |
| **AC-3** | La carga remota se activa con ≥ 2 caracteres e incluye debounce de 300 ms. |
| **AC-4** | Al alcanzar `maxItems`, no se pueden añadir más ítems y se muestra feedback visual. |
| **AC-5** | El control es completamente operable por teclado y pasa auditoría axe sin errores críticos. |
| **AC-6** | El evento `rms:change` se dispara correctamente en add y remove. |
| **AC-7** | Destruir el componente restaura el `<select>` original al estado previo a la inicialización. |
| **AC-8** | El estilo es coherente con Bootstrap 5 y el tema de Dharma sin regresiones visuales. |

---

## 8. Dependencias y Versiones

| Paquete | Versión | Motivo |
| :--- | :--- | :--- |
| `tom-select` | `^2.3` | Librería base |
| `tom-select/dist/css/tom-select.bootstrap5.css` | incluida en tom-select | Tema Bootstrap 5 |

Instalación:
```bash
npm install tom-select@^2.3 --save
```

---

## 9. Notas Técnicas y Restricciones

- **No usar Select2**: introduce jQuery como dependencia obligatoria, incompatible con la directiva de modernización del frontend de Dharma.
- **No polyfill IE11**: el componente requiere navegadores modernos (ES2020+). Los entornos de Dharma ya no soportan IE.
- El componente **no gestiona** la validación del formulario; es responsabilidad del formulario padre.
- Si el `<select>` se encuentra dentro de un modal de Bootstrap, re-inicializar el componente en el evento `shown.bs.modal` para evitar problemas de posicionamiento del desplegable.
