# Emagister JS Components Library

Una librería de componentes reutilizables en Javascript para proyectos de Emagister, diseñada con un enfoque en modularidad, personalización y carga perezosa (Lazy Loading).

## Instalación

Puedes instalar esta librería vía npm (si se publica en un registro privado) o directamente desde el repositorio:

```bash
npm install git+https://github.com/emagister/js-components.git
```

## Uso Principal: ComponentManager

La forma más eficiente de usar la librería es a través de la clase `ComponentManager`. Esta clase gestiona automáticamente la detección de componentes en el HTML e importa dinámicamente solo el código necesario (Lazy Loading).

### 1. Inicialización en JS

```javascript
import { ComponentManager } from '@emagister/js-components';

// Opción A: Uso Rápido (CSS estático)
import '@emagister/js-components.css'; 

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
     data-columns='[{"key":"id", "label":"ID"}, {"key":"name", "label":"Nombre", "sortable":true}]'
     data-settings='{ "perPage": 10, "sortBy": "name", "sortOrder": "desc" }'>
</div>

<!-- Ejemplo de Tooltip -->
<button data-component="tooltip" title="¡Soy un tooltip!">
  Hover me
</button>
```

## Componentes Disponibles

- `data-table`: Tabla dinámica con paginación, ordenación y filtrado.
## Componentes Disponibles y Configuración

Todos los componentes soportan configuración mediante el atributo `data-settings='{...}'` en el HTML.

### `data-table`
Tabla dinámica con paginación y ordenación.
- `perPage` (Number, default: 10): Filas por página.
- `filterFormId` (String): ID del formulario para filtrar la tabla.
- `sortBy` (String): Columna por la que ordenar inicialmente.
- `sortOrder` (String: 'asc'|'desc'): Dirección del orden inicial.
- `striped` (Boolean, default: true): Activa/desactiva el estilo de filas alternas.
- `hover` (Boolean, default: true): Activa/desactiva el efecto hover en filas.

### `async-form`
Gestión de formularios AJAX con validación.
- `messageDuration` (Number, default: 3000): Duración del toast de éxito/error en ms.
- Otros: Soporta `data-toast-target="#selector"` para feedback localizado.

### `message-toast`
Sistema de notificaciones.
- `mode` (String: 'global'|'local'): 'global' escucha eventos `toast:show`, 'local' solo responde a llamadas directas.
- `duration` (Number, default: 3000): Tiempo visible por defecto.

### Otros Componentes
- `loader`: Overlay de carga.
- `modal`: Diálogos de Bootstrap.
- `confirm`: Diálogos de confirmación (uso: `window.confirmCustom(msg, title)`).

### `datepicker`
Selector de fechas (Flatpickr).
- `dateFormat` (String, default: 'Y-m-d'): Formato de envío al servidor.
- `altInput` (Boolean, default: true): Muestra un input amigable al usuario.
- `altFormat` (String, default: 'd/m/Y'): Formato visual amigable.
- `allowInput` (Boolean, default: true): Permite escribir la fecha manualmente.
- *Cualquier opción nativa de Flatpickr* (ej: `minDate`, `maxDate`).
- `tooltip`: Tooltips de Bootstrap.

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

## Desarrollo y Build

Para generar los archivos de distribución (`dist/`), se requiere Docker:

```bash
docker run --rm --workdir /app --volume $PWD:/app emg_node npm run build
```

## Estructura del Proyecto

- `src/components/`: Cada componente tiene su propia carpeta con su JS y su SCSS específico.
- `src/styles/`: Variables globales y utilidades.
- `example/`: Aplicación de ejemplo completa para pruebas y referencia.

## Simulación de Backend en el Ejemplo

Dado que el ejemplo es puramente frontend, algunos componentes (`DataTable` y `AsyncForm`) utilizan una capa de simulación para interactuar con archivos JSON locales como si fueran una API real:

- **DataTable**: Carga datos desde `example/datatableData.json` y simula la paginación dinámica mediante el interceptor de peticiones.
- **AsyncForm**: Utiliza un interceptor de `fetch` en `example/js/main.js` para simular errores 422 (con feedback por campo) y éxitos mediante parámetros en la URL (ej: `?simulate-error`). Incluye retardos artificiales para visualizar los estados de carga.

Esto permite probar el comportamiento de validación y los estados de carga de los componentes sin necesidad de un backend activo durante el desarrollo.

---
© 2026 Emagister Development Team
