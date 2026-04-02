import { describe, it, expect, beforeEach } from 'vitest';
import DataTableTemplate from '../../../src/components/DataTable/DataTableTemplate.js';

describe('DataTableTemplate', () => {
    let template;
    let baseConfig;
    let baseState;

    beforeEach(() => {
        template = new DataTableTemplate();
        baseConfig = {
            columns: [
                { key: 'name', label: 'Nombre' },
                { key: 'age', label: 'Edad' },
            ],
            actions: [],
            striped: false,
            hover: true,
            headerClass: null,
        };
        baseState = {
            data: [{ id: 1, name: 'Alice', age: 30 }],
            meta: { page: 1, total: 1, perPage: 10, lastPage: 1 },
            sortBy: null,
            sortOrder: 'asc',
        };
    });

    describe('createContent()', () => {
        it('devuelve un contenedor con tabla y sección de paginación', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('.table-responsive')).not.toBeNull();
            expect(content.querySelector('table')).not.toBeNull();
        });

        it('aplica table-striped cuando config.striped es true', () => {
            const content = template.createContent(baseState, { ...baseConfig, striped: true });
            expect(content.querySelector('table').classList.contains('table-striped')).toBe(true);
        });

        it('aplica table-hover cuando config.hover es true', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('table').classList.contains('table-hover')).toBe(true);
        });

        it('no aplica table-hover cuando config.hover es false', () => {
            const content = template.createContent(baseState, { ...baseConfig, hover: false });
            expect(content.querySelector('table').classList.contains('table-hover')).toBe(false);
        });
    });

    describe('cabeceras', () => {
        it('renderiza una th por cada columna en config.columns', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelectorAll('thead th')).toHaveLength(2);
        });

        it('añade columna "Acciones" si hay actions definidas', () => {
            const config = { ...baseConfig, actions: [{ name: 'edit', label: 'Editar' }] };
            const content = template.createContent(baseState, config);
            const ths = content.querySelectorAll('thead th');
            expect(ths[ths.length - 1].textContent).toBe('Acciones');
        });

        it('no añade columna "Acciones" si actions está vacío', () => {
            const content = template.createContent(baseState, baseConfig);
            const ths = content.querySelectorAll('thead th');
            expect([...ths].map(th => th.textContent)).not.toContain('Acciones');
        });

        it('aplica headerClass a la fila de cabecera', () => {
            const config = { ...baseConfig, headerClass: 'table-dark' };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('thead tr').className).toBe('table-dark');
        });

        it('añade data-sort y cursor:pointer en columnas sortable', () => {
            const config = { ...baseConfig, columns: [{ key: 'name', label: 'Nombre', sortable: true }] };
            const content = template.createContent(baseState, config);
            const th = content.querySelector('thead th');
            expect(th.getAttribute('data-sort')).toBe('name');
            expect(th.style.cursor).toBe('pointer');
        });

        it('no añade data-sort en columnas no sortable', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('thead th[data-sort]')).toBeNull();
        });

        it('muestra ↑ en la columna actualmente ordenada asc', () => {
            const state = { ...baseState, sortBy: 'name', sortOrder: 'asc' };
            const config = { ...baseConfig, columns: [{ key: 'name', label: 'Nombre', sortable: true }] };
            const content = template.createContent(state, config);
            expect(content.querySelector('thead th').textContent).toContain('↑');
        });

        it('muestra ↓ en la columna actualmente ordenada desc', () => {
            const state = { ...baseState, sortBy: 'name', sortOrder: 'desc' };
            const config = { ...baseConfig, columns: [{ key: 'name', label: 'Nombre', sortable: true }] };
            const content = template.createContent(state, config);
            expect(content.querySelector('thead th').textContent).toContain('↓');
        });

        it('aplica headerClass a la th cuando col.headerClass está definido', () => {
            const config = { ...baseConfig, columns: [{ key: 'name', label: 'Nombre', headerClass: 'text-end' }] };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('thead th').classList.contains('text-end')).toBe(true);
        });
    });

    describe('cuerpo de la tabla', () => {
        it('muestra "No se encontraron resultados." cuando data está vacío', () => {
            const state = { ...baseState, data: [] };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('tbody td').textContent).toBe('No se encontraron resultados.');
        });

        it('el colspan del "sin resultados" cubre columnas y acciones', () => {
            const state = { ...baseState, data: [] };
            const config = { ...baseConfig, actions: [{ name: 'edit', label: 'Editar' }] };
            const content = template.createContent(state, config);
            expect(content.querySelector('tbody td').getAttribute('colspan')).toBe('3');
        });

        it('renderiza una fila por cada elemento de data', () => {
            const state = {
                ...baseState,
                data: [
                    { id: 1, name: 'Alice', age: 30 },
                    { id: 2, name: 'Bob', age: 25 },
                ],
            };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelectorAll('tbody tr')).toHaveLength(2);
        });

        it('asigna data-id a cada fila', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('tbody tr').getAttribute('data-id')).toBe('1');
        });

        it('renderiza texto plano por defecto', () => {
            const content = template.createContent(baseState, baseConfig);
            const tds = content.querySelectorAll('tbody tr td');
            expect(tds[0].textContent).toBe('Alice');
        });

        it('usa cadena vacía para valores null', () => {
            const state = { ...baseState, data: [{ id: 1, name: null, age: 30 }] };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('tbody tr td').textContent).toBe('');
        });

        it('renderiza celda como enlace cuando col.link está definido', () => {
            const config = { ...baseConfig, columns: [{ key: 'name', label: 'Nombre', link: 'url' }] };
            const state = { ...baseState, data: [{ id: 1, name: 'Alice', url: '/alice' }] };
            const content = template.createContent(state, config);
            const a = content.querySelector('tbody td a');
            expect(a).not.toBeNull();
            expect(a.getAttribute('href')).toBe('/alice');
            expect(a.textContent).toBe('Alice');
        });

        it('renderiza celda como badge cuando col.badge está definido', () => {
            const config = { ...baseConfig, columns: [{ key: 'status', label: 'Estado', badge: 'level' }] };
            const state = { ...baseState, data: [{ id: 1, status: 'Activo', level: 'success' }] };
            const content = template.createContent(state, config);
            const span = content.querySelector('tbody td span.badge');
            expect(span).not.toBeNull();
            expect(span.classList.contains('bg-success-subtle')).toBe(true);
            expect(span.textContent).toBe('Activo');
        });

        it('usa "secondary" como nivel de badge cuando la clave no existe en la fila', () => {
            const config = { ...baseConfig, columns: [{ key: 'status', label: 'Estado', badge: 'level' }] };
            const state = { ...baseState, data: [{ id: 1, status: 'N/A' }] };
            const content = template.createContent(state, config);
            const span = content.querySelector('tbody td span.badge');
            expect(span.classList.contains('bg-secondary-subtle')).toBe(true);
        });

        it('renderiza ícono check para valor boolean true', () => {
            const config = { ...baseConfig, columns: [{ key: 'active', label: 'Activo' }] };
            const state = { ...baseState, data: [{ id: 1, active: true }] };
            const content = template.createContent(state, config);
            const i = content.querySelector('tbody td i');
            expect(i.classList.contains('bi-check-lg')).toBe(true);
            expect(i.classList.contains('text-success')).toBe(true);
        });

        it('renderiza ícono x para valor boolean false', () => {
            const config = { ...baseConfig, columns: [{ key: 'active', label: 'Activo' }] };
            const state = { ...baseState, data: [{ id: 1, active: false }] };
            const content = template.createContent(state, config);
            const i = content.querySelector('tbody td i');
            expect(i.classList.contains('bi-x-lg')).toBe(true);
            expect(i.classList.contains('text-danger')).toBe(true);
        });
    });

    describe('acciones', () => {
        it('renderiza un botón por cada action sin states', () => {
            const config = {
                ...baseConfig,
                actions: [
                    { name: 'edit', label: 'Editar', icon: 'bi bi-pencil' },
                    { name: 'delete', label: 'Eliminar', icon: 'bi bi-trash' },
                ],
            };
            const content = template.createContent(baseState, config);
            const buttons = content.querySelectorAll('tbody td button[data-action]');
            expect(buttons).toHaveLength(2);
        });

        it('el botón de acción tiene data-action con el nombre de la action', () => {
            const config = { ...baseConfig, actions: [{ name: 'edit', label: 'Editar', icon: 'bi bi-pencil' }] };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('button[data-action]').getAttribute('data-action')).toBe('edit');
        });

        it('el botón de acción tiene data-component="tooltip"', () => {
            const config = { ...baseConfig, actions: [{ name: 'edit', label: 'Editar', icon: 'bi bi-pencil' }] };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('button[data-action]').getAttribute('data-component')).toBe('tooltip');
        });

        it('no renderiza action con states si ningún state.key es truthy en la fila', () => {
            const config = {
                ...baseConfig,
                actions: [{ name: 'approve', states: [{ key: 'pending', label: 'Aprobar', icon: 'bi bi-check' }] }],
            };
            const state = { ...baseState, data: [{ id: 1, name: 'Alice', age: 30, pending: false }] };
            const content = template.createContent(state, config);
            expect(content.querySelectorAll('tbody td button[data-action]')).toHaveLength(0);
        });

        it('renderiza action con el estado activo cuando state.key es truthy', () => {
            const config = {
                ...baseConfig,
                actions: [{ name: 'approve', states: [{ key: 'pending', label: 'Aprobar', icon: 'bi bi-check' }] }],
            };
            const state = { ...baseState, data: [{ id: 1, name: 'Alice', age: 30, pending: true }] };
            const content = template.createContent(state, config);
            const button = content.querySelector('button[data-action="approve"]');
            expect(button).not.toBeNull();
            expect(button.getAttribute('title')).toBe('Aprobar');
        });
    });

    describe('paginación', () => {
        it('no renderiza nav de paginación si lastPage <= 1', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('nav')).toBeNull();
        });

        it('renderiza nav de paginación cuando hay más de una página', () => {
            const state = { ...baseState, meta: { page: 1, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('nav')).not.toBeNull();
            expect(content.querySelector('ul.pagination')).not.toBeNull();
        });

        it('marca como active el elemento de la página actual', () => {
            const state = { ...baseState, meta: { page: 2, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            const activeItem = content.querySelector('.page-item.active');
            expect(activeItem.querySelector('.page-link').textContent).toBe('2');
        });

        it('deshabilita el botón Anterior en la primera página', () => {
            const state = { ...baseState, meta: { page: 1, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            const items = content.querySelectorAll('.page-item');
            expect(items[0].classList.contains('disabled')).toBe(true);
        });

        it('deshabilita el botón Siguiente en la última página', () => {
            const state = { ...baseState, meta: { page: 3, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            const items = content.querySelectorAll('.page-item');
            expect(items[items.length - 1].classList.contains('disabled')).toBe(true);
        });

        it('añade data-page a los enlaces de página válidos', () => {
            const state = { ...baseState, meta: { page: 1, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            const pageLinks = content.querySelectorAll('.page-link[data-page]');
            expect(pageLinks.length).toBeGreaterThan(0);
        });

        it('inserta "..." para páginas no adyacentes', () => {
            const state = { ...baseState, meta: { page: 5, total: 100, perPage: 10, lastPage: 10 } };
            const content = template.createContent(state, baseConfig);
            const linkTexts = [...content.querySelectorAll('.page-link')].map(a => a.textContent);
            expect(linkTexts).toContain('...');
        });
    });

    describe('createErrorContent()', () => {
        it('devuelve un elemento con la clase table-responsive', () => {
            const content = template.createErrorContent(baseConfig);
            expect(content.classList.contains('table-responsive')).toBe(true);
        });

        it('muestra el mensaje de error en el tbody', () => {
            const content = template.createErrorContent(baseConfig);
            expect(content.querySelector('td').textContent).toBe('Ocurrió un error al cargar los datos.');
        });

        it('el colspan del td cubre columnas y acciones', () => {
            const config = { ...baseConfig, actions: [{ name: 'edit', label: 'Editar' }] };
            const content = template.createErrorContent(config);
            expect(content.querySelector('td').getAttribute('colspan')).toBe('3');
        });

        it('el colspan del td cubre solo las columnas si no hay acciones', () => {
            const content = template.createErrorContent(baseConfig);
            expect(content.querySelector('td').getAttribute('colspan')).toBe('2');
        });
    });
});
