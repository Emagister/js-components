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
            labels: {
                total: 'Mostrando {from} - {to} de {total} resultados',
                noResults: 'No se encontraron resultados.',
                error: 'Ocurrió un error al cargar los datos.',
                previous: 'Anterior',
                next: 'Siguiente',
                actions: 'Acciones',
            },
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

    describe('total de resultados', () => {
        it('muestra el rango de la primera página', () => {
            const state = { ...baseState, meta: { page: 1, total: 50, perPage: 10, lastPage: 5 } };
            const content = template.createContent(state, baseConfig);
            const total = content.querySelector('.datatable-total');
            expect(total).not.toBeNull();
            expect(total.textContent).toBe('Mostrando 1 - 10 de 50 resultados');
        });

        it('muestra el rango de la segunda página', () => {
            const state = { ...baseState, meta: { page: 2, total: 1598, perPage: 20, lastPage: 80 } };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('.datatable-total').textContent).toBe('Mostrando 21 - 40 de 1598 resultados');
        });

        it('limita el "to" al total en la última página incompleta', () => {
            const state = { ...baseState, meta: { page: 3, total: 25, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('.datatable-total').textContent).toBe('Mostrando 21 - 25 de 25 resultados');
        });

        it('no muestra el total cuando meta.total es 0', () => {
            const state = { ...baseState, data: [], meta: { page: 1, total: 0, perPage: 10, lastPage: 1 } };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('.datatable-total')).toBeNull();
        });

        it('muestra el total incluso cuando solo hay una página', () => {
            const state = { ...baseState, meta: { page: 1, total: 5, perPage: 10, lastPage: 1 } };
            const content = template.createContent(state, baseConfig);
            expect(content.querySelector('.datatable-total').textContent).toBe('Mostrando 1 - 5 de 5 resultados');
        });

        it('el total aparece antes de la nav de paginación', () => {
            const state = { ...baseState, meta: { page: 1, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, baseConfig);
            const paginationContainer = content.querySelector('.mt-3');
            const children = [...paginationContainer.children];
            // datatable-total vive dentro del grupo izquierdo (primer hijo directo)
            const leftGroupIdx = children.findIndex(el => el.querySelector('.datatable-total'));
            const navIdx = children.findIndex(el => el.tagName === 'NAV');
            expect(leftGroupIdx).toBeLessThan(navIdx);
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

    describe('ancho de columnas (width)', () => {
        it('no renderiza colgroup si ninguna columna tiene width definido', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('colgroup')).toBeNull();
        });

        it('renderiza colgroup cuando al menos una columna tiene width definido', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                    { key: 'age', label: 'Edad' },
                ],
            };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('colgroup')).not.toBeNull();
        });

        it('aplica el ancho correcto al col de la columna con width', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                    { key: 'age', label: 'Edad' },
                ],
            };
            const content = template.createContent(baseState, config);
            const cols = content.querySelectorAll('colgroup col');
            expect(cols[0].style.width).toBe('200px');
        });

        it('el col sin width no tiene style width', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                    { key: 'age', label: 'Edad' },
                ],
            };
            const content = template.createContent(baseState, config);
            const cols = content.querySelectorAll('colgroup col');
            expect(cols[1].style.width).toBe('');
        });

        it('incluye col para la columna de acciones cuando hay actions', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                    { key: 'age', label: 'Edad' },
                ],
                actions: [{ name: 'edit', label: 'Editar' }],
            };
            const content = template.createContent(baseState, config);
            const cols = content.querySelectorAll('colgroup col');
            expect(cols).toHaveLength(3); // 2 columnas + 1 acciones
        });

        it('soporta width como porcentaje', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '40%' },
                    { key: 'age', label: 'Edad' },
                ],
            };
            const content = template.createContent(baseState, config);
            const cols = content.querySelectorAll('colgroup col');
            expect(cols[0].style.width).toBe('40%');
        });

        it('aplica actionsWidth al col de acciones cuando hay actions y columnas con width', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                    { key: 'age', label: 'Edad' },
                ],
                actions: [{ name: 'edit', label: 'Editar' }],
                actionsWidth: '120px',
            };
            const content = template.createContent(baseState, config);
            const cols = content.querySelectorAll('colgroup col');
            // último col = acciones
            expect(cols[cols.length - 1].style.width).toBe('120px');
        });

        it('genera colgroup solo con actionsWidth aunque ninguna columna tenga width', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre' },
                    { key: 'age', label: 'Edad' },
                ],
                actions: [{ name: 'edit', label: 'Editar' }],
                actionsWidth: '80px',
            };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('colgroup')).not.toBeNull();
        });

        it('el col de acciones sin actionsWidth no tiene style width', () => {
            const config = {
                ...baseConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                ],
                actions: [{ name: 'edit', label: 'Editar' }],
            };
            const content = template.createContent(baseState, config);
            const cols = content.querySelectorAll('colgroup col');
            expect(cols[cols.length - 1].style.width).toBe('');
        });
    });

    describe('labels personalizados', () => {
        it('usa config.labels.total con placeholders {from}, {to} y {total}', () => {
            const config = { ...baseConfig, labels: { ...baseConfig.labels, total: 'Showing {from}-{to} of {total}' } };
            const state = { ...baseState, meta: { page: 2, total: 50, perPage: 10, lastPage: 5 } };
            const content = template.createContent(state, config);
            expect(content.querySelector('.datatable-total').textContent).toBe('Showing 11-20 of 50');
        });

        it('usa config.labels.noResults cuando no hay datos', () => {
            const config = { ...baseConfig, labels: { ...baseConfig.labels, noResults: 'No results found.' } };
            const state = { ...baseState, data: [] };
            const content = template.createContent(state, config);
            expect(content.querySelector('tbody td').textContent).toBe('No results found.');
        });

        it('usa config.labels.error en createErrorContent', () => {
            const config = { ...baseConfig, labels: { ...baseConfig.labels, error: 'Failed to load data.' } };
            const content = template.createErrorContent(config);
            expect(content.querySelector('td').textContent).toBe('Failed to load data.');
        });

        it('usa config.labels.previous y next en la paginación', () => {
            const config = { ...baseConfig, labels: { ...baseConfig.labels, previous: 'Prev', next: 'Next' } };
            const state = { ...baseState, meta: { page: 2, total: 30, perPage: 10, lastPage: 3 } };
            const content = template.createContent(state, config);
            const links = [...content.querySelectorAll('.page-link')].map(a => a.textContent);
            expect(links).toContain('Prev');
            expect(links).toContain('Next');
        });

        it('usa config.labels.actions en la cabecera de acciones', () => {
            const config = {
                ...baseConfig,
                actions: [{ name: 'edit', label: 'Edit' }],
                labels: { ...baseConfig.labels, actions: 'Actions' },
            };
            const content = template.createContent(baseState, config);
            const ths = content.querySelectorAll('thead th');
            expect(ths[ths.length - 1].textContent).toBe('Actions');
        });
    });

    describe('eliminación masiva (bulkDeleteUrl)', () => {
        let bulkConfig;
        let bulkState;

        beforeEach(() => {
            bulkConfig = {
                ...baseConfig,
                bulkDeleteUrl: '/api/bulk-delete',
                labels: {
                    ...baseConfig.labels,
                    bulkDelete: 'Eliminar seleccionados',
                },
            };
            bulkState = {
                ...baseState,
                selectedIds: new Set(),
            };
        });

        it('añade th con checkbox de selección global cuando bulkDeleteUrl está definido', () => {
            const content = template.createContent(bulkState, bulkConfig);
            expect(content.querySelector('thead th [data-select-all]')).not.toBeNull();
        });

        it('no añade th de checkbox cuando bulkDeleteUrl no está definido', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('[data-select-all]')).toBeNull();
        });

        it('el th de checkbox es la primera columna del encabezado', () => {
            const content = template.createContent(bulkState, bulkConfig);
            const firstTh = content.querySelector('thead th:first-child');
            expect(firstTh.querySelector('[data-select-all]')).not.toBeNull();
        });

        it('añade td con checkbox en cada fila cuando bulkDeleteUrl está definido', () => {
            const content = template.createContent(bulkState, bulkConfig);
            expect(content.querySelectorAll('tbody td [data-select-id]')).toHaveLength(1);
        });

        it('el checkbox de fila tiene data-select-id con el id de la fila', () => {
            const content = template.createContent(bulkState, bulkConfig);
            expect(content.querySelector('[data-select-id]').getAttribute('data-select-id')).toBe('1');
        });

        it('el td de checkbox es la primera celda de cada fila', () => {
            const content = template.createContent(bulkState, bulkConfig);
            const firstTd = content.querySelector('tbody tr td:first-child');
            expect(firstTd.querySelector('[data-select-id]')).not.toBeNull();
        });

        it('el checkbox de fila está marcado cuando el id está en selectedIds', () => {
            const state = { ...bulkState, selectedIds: new Set(['1']) };
            const content = template.createContent(state, bulkConfig);
            expect(content.querySelector('[data-select-id="1"]').checked).toBe(true);
        });

        it('el checkbox de fila no está marcado cuando el id no está en selectedIds', () => {
            const content = template.createContent(bulkState, bulkConfig);
            expect(content.querySelector('[data-select-id="1"]').checked).toBe(false);
        });

        it('el colspan del "sin resultados" incluye la columna de checkbox', () => {
            const state = { ...bulkState, data: [] };
            const content = template.createContent(state, bulkConfig);
            // 2 columns + 1 checkbox = 3
            expect(content.querySelector('tbody td').getAttribute('colspan')).toBe('3');
        });

        it('renderiza la barra de acciones masivas cuando bulkDeleteUrl está definido', () => {
            const content = template.createContent(bulkState, bulkConfig);
            expect(content.querySelector('.datatable-bulk-actions')).not.toBeNull();
        });

        it('no renderiza la barra de acciones masivas cuando bulkDeleteUrl no está definido', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('.datatable-bulk-actions')).toBeNull();
        });

        it('la barra está oculta cuando no hay ids seleccionados', () => {
            const content = template.createContent(bulkState, bulkConfig);
            expect(content.querySelector('.datatable-bulk-actions').classList.contains('d-none')).toBe(true);
        });

        it('la barra es visible cuando hay ids seleccionados', () => {
            const state = { ...bulkState, selectedIds: new Set(['1']) };
            const content = template.createContent(state, bulkConfig);
            expect(content.querySelector('.datatable-bulk-actions').classList.contains('d-none')).toBe(false);
        });

        it('el botón de eliminación masiva muestra el label y el count de seleccionados', () => {
            const state = { ...bulkState, selectedIds: new Set(['1']) };
            const content = template.createContent(state, bulkConfig);
            const btn = content.querySelector('[data-bulk-delete]');
            expect(btn.textContent).toContain('Eliminar seleccionados');
            expect(btn.textContent).toContain('1');
        });

        it('el colgroup incluye col para la columna de checkbox cuando bulkDeleteUrl está definido', () => {
            const config = {
                ...bulkConfig,
                columns: [
                    { key: 'name', label: 'Nombre', width: '200px' },
                    { key: 'age', label: 'Edad' },
                ],
            };
            const content = template.createContent(bulkState, config);
            const cols = content.querySelectorAll('colgroup col');
            // 2 columns + 1 checkbox = 3
            expect(cols).toHaveLength(3);
        });
    });

    describe('selector de elementos por página', () => {
        let perPageConfig;

        beforeEach(() => {
            perPageConfig = {
                ...baseConfig,
                pageSizeOptions: [10, 25, 50, 100],
                labels: {
                    ...baseConfig.labels,
                    perPage: 'Filas por página:',
                },
            };
        });

        it('renderiza un select con data-per-page cuando pageSizeOptions tiene valores', () => {
            const content = template.createContent(baseState, perPageConfig);
            expect(content.querySelector('[data-per-page]')).not.toBeNull();
        });

        it('no renderiza el select cuando pageSizeOptions está vacío', () => {
            const config = { ...perPageConfig, pageSizeOptions: [] };
            const content = template.createContent(baseState, config);
            expect(content.querySelector('[data-per-page]')).toBeNull();
        });

        it('no renderiza el select cuando pageSizeOptions no está definido', () => {
            const content = template.createContent(baseState, baseConfig);
            expect(content.querySelector('[data-per-page]')).toBeNull();
        });

        it('renderiza una opción por cada valor de pageSizeOptions', () => {
            const content = template.createContent(baseState, perPageConfig);
            const options = content.querySelectorAll('[data-per-page] option');
            expect(options).toHaveLength(4);
        });

        it('los valores de las opciones coinciden con pageSizeOptions', () => {
            const content = template.createContent(baseState, perPageConfig);
            const values = [...content.querySelectorAll('[data-per-page] option')].map(o => parseInt(o.value));
            expect(values).toEqual([10, 25, 50, 100]);
        });

        it('marca como selected la opción que coincide con meta.perPage', () => {
            const state = { ...baseState, meta: { ...baseState.meta, perPage: 25 } };
            const content = template.createContent(state, perPageConfig);
            const select = content.querySelector('[data-per-page]');
            expect(parseInt(select.value)).toBe(25);
        });

        it('usa config.labels.perPage como texto del label', () => {
            const content = template.createContent(baseState, perPageConfig);
            const perPageWrapper = content.querySelector('[data-per-page]').closest('div');
            expect(perPageWrapper.textContent).toContain('Filas por página:');
        });

        it('el selector de página aparece dentro del contenedor de paginación', () => {
            const content = template.createContent(baseState, perPageConfig);
            const paginationContainer = content.querySelector('.mt-3');
            expect(paginationContainer.querySelector('[data-per-page]')).not.toBeNull();
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
