# Ejemplo de Integración

Este directorio contiene un ejemplo funcional de cómo integrar la librería `@emagister/js-components` en un proyecto real.

## Características del ejemplo

1.  **Personalización con Sass**: El archivo `scss/styles.scss` utiliza la sintaxis `@use ... with` para sobrescribir las variables por defecto de la librería.
2.  **Inicialización de Componentes**: El archivo `main.js` muestra cómo instanciar e inicializar manualmente el DataTable, Modal, Confirm, etc.
3.  **Integración con API**: El DataTable carga datos reales de una API pública (`jsonplaceholder`).

## Cómo ejecutarlo

Si estás en el entorno de desarrollo de la librería:

1.  Asegúrate de haber instalado las dependencias:
    `npm install`
2.  Arranca el servidor de desarrollo de Vite:
    `npm run dev`
3.  Abre tu navegador en:
    `http://localhost:5173/example/`

## Notas de implementación

En un proyecto real, importarías los componentes desde `@emagister/js-components`. En este ejemplo, para facilitar el desarrollo, importamos directamente desde `../src/index.js`.
