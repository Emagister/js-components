import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DataTable from '../../../src/components/DataTable/DataTable.js';

describe('DataTable', () => {
    let element;

    const mockFetch = (data = [], meta = { page: 1, total: 0, perPage: 10 }) => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data, meta }),
        });
    };

    beforeEach(() => {
        element = document.createElement('div');
        element.dataset.url = '/api/data';
        element.dataset.columns = JSON.stringify([{ key: 'name', label: 'Nombre' }]);
        document.body.appendChild(element);
        window.scrollTo = vi.fn();
        mockFetch();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('lee la url del dataset', () => {
            const dt = new DataTable(element);
            expect(dt.config.url).toBe('/api/data');
        });

        it('lee columns del dataset', () => {
            const dt = new DataTable(element);
            expect(dt.config.columns).toHaveLength(1);
        });

        it('usa perPage 10 por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.perPage).toBe(10);
        });

        it('usa sortOrder "asc" por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.sortOrder).toBe('asc');
        });

        it('usa hover true por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.hover).toBe(true);
        });

        it('lee configuración desde data-settings JSON', () => {
            element.dataset.settings = JSON.stringify({ perPage: 25, striped: true, scrollOffset: 60 });
            const dt = new DataTable(element);
            expect(dt.config.perPage).toBe(25);
            expect(dt.config.striped).toBe(true);
            expect(dt.config.scrollOffset).toBe(60);
        });

        it('data-settings tiene prioridad sobre atributos individuales del dataset', () => {
            element.dataset.perPage = '5';
            element.dataset.settings = JSON.stringify({ perPage: 20 });
            const dt = new DataTable(element);
            expect(dt.config.perPage).toBe(20);
        });

        it('tiene labels en español por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.labels.total).toBe('Mostrando {from} - {to} de {total} resultados');
            expect(dt.config.labels.noResults).toBe('No se encontraron resultados.');
            expect(dt.config.labels.error).toBe('Ocurrió un error al cargar los datos.');
            expect(dt.config.labels.previous).toBe('Anterior');
            expect(dt.config.labels.next).toBe('Siguiente');
            expect(dt.config.labels.actions).toBe('Acciones');
        });

        it('permite personalizar labels desde data-settings', () => {
            element.dataset.settings = JSON.stringify({
                labels: { total: 'Showing {from}-{to} of {total}', previous: 'Previous', next: 'Next' }
            });
            const dt = new DataTable(element);
            expect(dt.config.labels.total).toBe('Showing {from}-{to} of {total}');
            expect(dt.config.labels.previous).toBe('Previous');
            expect(dt.config.labels.next).toBe('Next');
            expect(dt.config.labels.noResults).toBe('No se encontraron resultados.');
        });

        it('inicializa el estado con page 1', () => {
            const dt = new DataTable(element);
            expect(dt.state.meta.page).toBe(1);
        });

        it('inicializa isLoading en false', () => {
            const dt = new DataTable(element);
            expect(dt.state.isLoading).toBe(false);
        });
    });

    describe('init()', () => {
        it('emite el evento emg-jsc:datatable:initialized', async () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:datatable:initialized', handler);
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
        });

        it('crea el contentWrapper dentro del elemento raíz', () => {
            const dt = new DataTable(element);
            dt.init();
            expect(element.querySelector('div')).not.toBeNull();
        });

        it('llama a fetch con la URL configurada', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
            expect(fetch.mock.calls[0][0]).toContain('/api/data');
        });

        it('incluye el header X-Requested-With: XMLHttpRequest', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
            expect(fetch.mock.calls[0][1].headers['X-Requested-With']).toBe('XMLHttpRequest');
        });
    });

    describe('renderizado de datos', () => {
        it('renderiza filas con los datos recibidos del servidor', async () => {
            mockFetch([{ id: 1, name: 'Alice' }], { page: 1, total: 1, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('tbody')).not.toBeNull());
            expect(element.querySelector('tbody').textContent).toContain('Alice');
        });

        it('renderiza el mensaje de error cuando el fetch lanza excepción', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
            vi.spyOn(console, 'error').mockImplementation(() => {});
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() =>
                expect(element.textContent).toContain('Ocurrió un error al cargar los datos.')
            );
        });

        it('renderiza el mensaje de error cuando la respuesta no es ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });
            vi.spyOn(console, 'error').mockImplementation(() => {});
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() =>
                expect(element.textContent).toContain('Ocurrió un error al cargar los datos.')
            );
        });

        it('emite emg-jsc:component:scan tras renderizar el contenido', async () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:component:scan', handler);
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(handler).toHaveBeenCalled());
        });

        it('calcula lastPage correctamente en función del total y perPage', async () => {
            mockFetch([], { page: 1, total: 25, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
            await vi.waitFor(() => expect(dt.state.meta.lastPage).toBe(3));
        });
    });

    describe('handleSort()', () => {
        it('cambia sortOrder a desc al ordenar por la misma columna que ya está en asc', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

            dt.state.sortBy = 'name';
            dt.state.sortOrder = 'asc';
            dt.state.isLoading = false;

            dt.handleSort('name');
            expect(dt.state.sortOrder).toBe('desc');
        });

        it('cambia a asc al ordenar por una columna diferente', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

            dt.state.sortBy = 'age';
            dt.state.sortOrder = 'desc';
            dt.state.isLoading = false;

            dt.handleSort('name');
            expect(dt.state.sortBy).toBe('name');
            expect(dt.state.sortOrder).toBe('asc');
        });

        it('resetea la página a 1 al cambiar el orden', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

            dt.state.meta.page = 3;
            dt.state.isLoading = false;

            dt.handleSort('name');
            expect(dt.state.meta.page).toBe(1);
        });

        it('lanza una nueva petición fetch al cambiar el orden', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

            dt.state.isLoading = false;
            dt.handleSort('name');
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        });

        it('ignora el segundo fetch si ya hay una petición en curso', () => {
            let resolveFirst;
            global.fetch = vi.fn()
                .mockReturnValueOnce(new Promise(r => { resolveFirst = r; }))
                .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [], meta: { page: 1, total: 0, perPage: 10 } }) });

            const dt = new DataTable(element);
            dt.init(); // isLoading pasa a true, fetch pendiente

            dt.handleSort('name'); // isLoading sigue true, debe ignorarse

            expect(fetch).toHaveBeenCalledTimes(1);

            resolveFirst({ ok: true, json: () => Promise.resolve({ data: [], meta: { page: 1, total: 0, perPage: 10 } }) });
        });
    });

    describe('handlePageChange()', () => {
        async function initAndWait() {
            // total:50, perPage:10 → lastPage:5; esperamos a que el fetch complete del todo
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [], meta: { page: 1, total: 50, perPage: 10 } }),
            });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(dt.state.isLoading).toBe(false));
            dt.state.meta.page = 2;
            return dt;
        }

        it('no cambia la página si el número es menor que 1', async () => {
            const dt = await initAndWait();
            dt.handlePageChange(0);
            expect(dt.state.meta.page).toBe(2);
        });

        it('no cambia la página si supera lastPage', async () => {
            const dt = await initAndWait();
            dt.handlePageChange(6);
            expect(dt.state.meta.page).toBe(2);
        });

        it('no lanza fetch si la página pedida es la misma que la actual', async () => {
            const dt = await initAndWait();
            const callsBefore = fetch.mock.calls.length;
            dt.handlePageChange(2);
            expect(fetch.mock.calls.length).toBe(callsBefore);
        });

        it('actualiza la página y lanza fetch en un cambio válido', async () => {
            const dt = await initAndWait();
            dt.handlePageChange(3);
            expect(dt.state.meta.page).toBe(3);
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        });

        it('llama a window.scrollTo al cambiar de página', async () => {
            const dt = await initAndWait();
            dt.handlePageChange(3);
            expect(window.scrollTo).toHaveBeenCalled();
        });
    });

    describe('corrección automática de página al recargar', () => {
        it('redirige a la última página válida si la página actual queda fuera de rango tras un fetch', async () => {
            // Página 2 de 2 con 1 elemento; tras borrar queda 1 página con 10 elementos
            let callCount = 0;
            global.fetch = vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    // init fetch: 11 elementos, 2 páginas, estamos en página 1
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [], meta: { page: 1, total: 11, perPage: 10 } }) });
                }
                if (callCount === 2) {
                    // refresh tras borrar: ahora hay 10 elementos (1 página), pero el state.meta.page sigue en 2
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ id: 1 }], meta: { page: 2, total: 10, perPage: 10 } }) });
                }
                // tercer fetch: pedimos página 1 (la corrección automática)
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ id: 1 }], meta: { page: 1, total: 10, perPage: 10 } }) });
            });

            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(dt.state.isLoading).toBe(false));

            // Simulamos que el usuario estaba en página 2
            dt.state.meta.page = 2;
            dt.state.isLoading = false;

            // Dispara el refresh (como si se hubiera borrado un elemento)
            element.dispatchEvent(new Event('emg-jsc:datatable:refresh'));

            // Debe haberse lanzado un tercer fetch corrigiendo la página a 1
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));

            // Y la página final debe ser 1
            expect(dt.state.meta.page).toBe(1);
        });

        it('no lanza un fetch extra si la página actual es válida', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: [{ id: 1 }], meta: { page: 1, total: 20, perPage: 10 } }),
            });

            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(dt.state.isLoading).toBe(false));
            dt.state.isLoading = false;

            element.dispatchEvent(new Event('emg-jsc:datatable:refresh'));
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

            // Solo 2 fetches: el inicial y el refresh — sin fetch extra de corrección
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(dt.state.meta.page).toBe(1);
        });
    });

    describe('setFilters()', () => {
        it('actualiza los filtros en el estado', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            dt.state.isLoading = false;

            dt.setFilters({ name: 'Bob' });
            expect(dt.state.filters).toEqual({ name: 'Bob' });
        });

        it('resetea la página a 1 al aplicar nuevos filtros', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            dt.state.meta.page = 3;
            dt.state.isLoading = false;

            dt.setFilters({ name: 'Bob' });
            expect(dt.state.meta.page).toBe(1);
        });

        it('lanza una nueva petición fetch tras actualizar los filtros', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            dt.state.isLoading = false;

            dt.setFilters({ name: 'Bob' });
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        });

        it('incluye los filtros en los query params del fetch', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            dt.state.isLoading = false;

            dt.setFilters({ status: 'active' });
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
            expect(fetch.mock.calls[1][0]).toContain('status=active');
        });
    });

    describe('handleAction()', () => {
        it('emite el evento emg-jsc:datatable:action con action, id y row', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

            dt.state.data = [{ id: 42, name: 'Alice' }];

            const handler = vi.fn();
            element.addEventListener('emg-jsc:datatable:action', handler);

            dt.handleAction('edit', 42);

            expect(handler).toHaveBeenCalledOnce();
            const { action, id, row } = handler.mock.calls[0][0].detail;
            expect(action).toBe('edit');
            expect(id).toBe(42);
            expect(row.name).toBe('Alice');
        });

        it('el evento emg-jsc:datatable:action burbujea en el DOM', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

            dt.state.data = [{ id: 1, name: 'Alice' }];

            const handler = vi.fn();
            document.body.addEventListener('emg-jsc:datatable:action', handler);

            dt.handleAction('delete', 1);
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    describe('eventos del DOM', () => {
        it('refresca datos al recibir emg-jsc:datatable:refresh', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            dt.state.isLoading = false;

            element.dispatchEvent(new Event('emg-jsc:datatable:refresh'));
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        });

        it('muestra el loader al recibir emg-jsc:datatable:loader:show', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

            element.dispatchEvent(new Event('emg-jsc:datatable:loader:show'));
            expect(element.querySelector('.loader-overlay').classList.contains('is-visible')).toBe(true);
        });

        it('oculta el loader al recibir emg-jsc:datatable:loader:hide', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());

            element.dispatchEvent(new Event('emg-jsc:datatable:loader:show'));
            element.dispatchEvent(new Event('emg-jsc:datatable:loader:hide'));
            expect(element.querySelector('.loader-overlay').classList.contains('is-visible')).toBe(false);
        });

        it('ordena por columna al hacer click en un th con data-sort', async () => {
            mockFetch([{ id: 1, name: 'Alice' }], { page: 1, total: 1, perPage: 10 });
            element.dataset.columns = JSON.stringify([{ key: 'name', label: 'Nombre', sortable: true }]);
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('thead th[data-sort]')).not.toBeNull());
            dt.state.isLoading = false;

            const th = element.querySelector('thead th[data-sort]');
            th.click();
            expect(dt.state.sortBy).toBe('name');
        });

        it('cambia de página al hacer click en un enlace con data-page', async () => {
            mockFetch([], { page: 1, total: 30, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('[data-page]')).not.toBeNull());
            dt.state.isLoading = false;

            const pageLink = element.querySelector('[data-page="2"]');
            pageLink.click();
            expect(dt.state.meta.page).toBe(2);
        });
    });

    describe('eliminación masiva', () => {
        beforeEach(() => {
            element.dataset.bulkDeleteUrl = '/api/bulk-delete';
            mockFetch(
                [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
                { page: 1, total: 2, perPage: 10 }
            );
        });

        describe('configuración', () => {
            it('lee bulkDeleteUrl del dataset', () => {
                const dt = new DataTable(element);
                expect(dt.config.bulkDeleteUrl).toBe('/api/bulk-delete');
            });

            it('bulkDeleteUrl es null por defecto', () => {
                delete element.dataset.bulkDeleteUrl;
                const dt = new DataTable(element);
                expect(dt.config.bulkDeleteUrl).toBeNull();
            });

            it('tiene label bulkDelete "Eliminar seleccionados" por defecto', () => {
                const dt = new DataTable(element);
                expect(dt.config.labels.bulkDelete).toBe('Eliminar seleccionados');
            });

            it('permite personalizar el label bulkDelete desde data-settings', () => {
                element.dataset.settings = JSON.stringify({ labels: { bulkDelete: 'Delete selected' } });
                const dt = new DataTable(element);
                expect(dt.config.labels.bulkDelete).toBe('Delete selected');
            });

            it('inicializa selectedIds como un Set vacío', () => {
                const dt = new DataTable(element);
                expect(dt.state.selectedIds).toBeInstanceOf(Set);
                expect(dt.state.selectedIds.size).toBe(0);
            });
        });

        describe('renderizado de checkboxes', () => {
            it('muestra checkboxes por fila cuando bulkDeleteUrl está configurado', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());
                expect(element.querySelectorAll('[data-select-id]')).toHaveLength(2);
            });

            it('no muestra checkboxes cuando bulkDeleteUrl no está configurado', async () => {
                delete element.dataset.bulkDeleteUrl;
                mockFetch([{ id: 1, name: 'Alice' }], { page: 1, total: 1, perPage: 10 });
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('tbody tr')).not.toBeNull());
                expect(element.querySelector('[data-select-id]')).toBeNull();
            });

            it('muestra checkbox de selección global en el encabezado', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-all]')).not.toBeNull());
            });
        });

        describe('selección de filas', () => {
            it('selecciona una fila al hacer click en su checkbox', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();
                expect(dt.state.selectedIds.has('1')).toBe(true);
            });

            it('deselecciona una fila al desmarcar su checkbox', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                const checkbox = element.querySelector('[data-select-id="1"]');
                checkbox.click();
                checkbox.click();
                expect(dt.state.selectedIds.has('1')).toBe(false);
            });

            it('selecciona todas las filas al hacer click en el checkbox global', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-all]')).not.toBeNull());

                element.querySelector('[data-select-all]').click();
                expect(dt.state.selectedIds.size).toBe(2);
            });

            it('deselecciona todas las filas al desmarcar el checkbox global', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-all]')).not.toBeNull());

                const selectAll = element.querySelector('[data-select-all]');
                selectAll.click();
                selectAll.click();
                expect(dt.state.selectedIds.size).toBe(0);
            });
        });

        describe('barra de acciones masivas', () => {
            it('la barra de acciones masivas está oculta inicialmente', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('.datatable-bulk-actions')).not.toBeNull());
                expect(element.querySelector('.datatable-bulk-actions').classList.contains('d-none')).toBe(true);
            });

            it('muestra la barra al seleccionar una fila', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();
                expect(element.querySelector('.datatable-bulk-actions').classList.contains('d-none')).toBe(false);
            });

            it('oculta la barra al deseleccionar todas las filas', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                const checkbox = element.querySelector('[data-select-id="1"]');
                checkbox.click();
                checkbox.click();
                expect(element.querySelector('.datatable-bulk-actions').classList.contains('d-none')).toBe(true);
            });

            it('muestra el número de elementos seleccionados en el botón', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();
                element.querySelector('[data-select-id="2"]').click();
                const btn = element.querySelector('[data-bulk-delete]');
                expect(btn.textContent).toContain('2');
            });
        });

        describe('handleBulkDelete()', () => {
            it('envía POST a bulkDeleteUrl con los ids seleccionados', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                global.fetch = vi.fn()
                    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
                    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [], meta: { page: 1, total: 0, perPage: 10 } }) });

                element.querySelector('[data-bulk-delete]').click();

                await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
                const [url, options] = fetch.mock.calls[0];
                expect(url).toBe('/api/bulk-delete');
                expect(options.method).toBe('DELETE');
                expect(JSON.parse(options.body)).toEqual({ ids: ['1'] });
            });

            it('limpia la selección tras eliminar correctamente', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                global.fetch = vi.fn()
                    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
                    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [], meta: { page: 1, total: 0, perPage: 10 } }) });

                element.querySelector('[data-bulk-delete]').click();
                await vi.waitFor(() => expect(dt.state.selectedIds.size).toBe(0));
            });

            it('emite emg-jsc:datatable:bulk-delete:success tras eliminar', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                global.fetch = vi.fn()
                    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
                    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [], meta: { page: 1, total: 0, perPage: 10 } }) });

                const handler = vi.fn();
                element.addEventListener('emg-jsc:datatable:bulk-delete:success', handler);

                element.querySelector('[data-bulk-delete]').click();
                await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
                expect(handler.mock.calls[0][0].detail.count).toBe(1);
            });

            it('emite emg-jsc:datatable:bulk-delete:error si el servidor responde con error', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                global.fetch = vi.fn().mockResolvedValue({ ok: false });
                vi.spyOn(console, 'error').mockImplementation(() => {});

                const handler = vi.fn();
                element.addEventListener('emg-jsc:datatable:bulk-delete:error', handler);

                element.querySelector('[data-bulk-delete]').click();
                await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
            });

            it('refresca los datos tras eliminar correctamente', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                let callCount = 0;
                global.fetch = vi.fn().mockImplementation((url) => {
                    callCount++;
                    const body = url === '/api/bulk-delete'
                        ? {}
                        : { data: [], meta: { page: 1, total: 0, perPage: 10 } };
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
                });

                element.querySelector('[data-bulk-delete]').click();
                await vi.waitFor(() => expect(callCount).toBe(2));
            });

            it('muestra el loader mientras se procesa el borrado masivo', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                let loaderVisibleDuringRequest = false;
                global.fetch = vi.fn().mockImplementation((url) => {
                    if (url === '/api/bulk-delete') {
                        loaderVisibleDuringRequest = element.querySelector('.loader-overlay').classList.contains('is-visible');
                    }
                    return Promise.resolve({ ok: true, json: () => Promise.resolve(
                        url === '/api/bulk-delete' ? {} : { data: [], meta: { page: 1, total: 0, perPage: 10 } }
                    )});
                });

                element.querySelector('[data-bulk-delete]').click();
                await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/bulk-delete', expect.anything()));
                expect(loaderVisibleDuringRequest).toBe(true);
            });

            it('oculta el loader si el borrado masivo falla', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-select-id]')).not.toBeNull());

                element.querySelector('[data-select-id="1"]').click();

                global.fetch = vi.fn().mockResolvedValue({ ok: false });
                vi.spyOn(console, 'error').mockImplementation(() => {});

                element.querySelector('[data-bulk-delete]').click();
                await vi.waitFor(() => expect(
                    element.querySelector('.loader-overlay').classList.contains('is-visible')
                ).toBe(false));
            });

            it('no llama al endpoint si no hay ids seleccionados', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(element.querySelector('[data-bulk-delete]')).not.toBeNull());

                global.fetch = vi.fn();
                element.querySelector('[data-bulk-delete]').click();
                expect(fetch).not.toHaveBeenCalled();
            });
        });
    });

    describe('selector de elementos por página', () => {
        it('tiene pageSizeOptions [10, 25, 50, 100] por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.pageSizeOptions).toEqual([10, 25, 50, 100]);
        });

        it('permite personalizar pageSizeOptions desde data-settings', () => {
            element.dataset.settings = JSON.stringify({ pageSizeOptions: [5, 10, 20] });
            const dt = new DataTable(element);
            expect(dt.config.pageSizeOptions).toEqual([5, 10, 20]);
        });

        it('tiene actionsWidth "80px" por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.actionsWidth).toBe('80px');
        });

        it('permite personalizar actionsWidth desde data-settings', () => {
            element.dataset.settings = JSON.stringify({ actionsWidth: '120px' });
            const dt = new DataTable(element);
            expect(dt.config.actionsWidth).toBe('120px');
        });

        it('tiene label perPage "Filas por página:" por defecto', () => {
            const dt = new DataTable(element);
            expect(dt.config.labels.perPage).toBe('Filas por página:');
        });

        it('permite personalizar el label perPage desde data-settings', () => {
            element.dataset.settings = JSON.stringify({ labels: { perPage: 'Rows per page:' } });
            const dt = new DataTable(element);
            expect(dt.config.labels.perPage).toBe('Rows per page:');
        });

        it('renderiza un select con data-per-page tras init', async () => {
            mockFetch([], { page: 1, total: 0, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('[data-per-page]')).not.toBeNull());
        });

        it('cambia perPage en el estado al seleccionar una opción', async () => {
            mockFetch([], { page: 1, total: 50, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('[data-per-page]')).not.toBeNull());
            dt.state.isLoading = false;

            const select = element.querySelector('[data-per-page]');
            select.value = '25';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            expect(dt.state.meta.perPage).toBe(25);
        });

        it('resetea la página a 1 al cambiar perPage', async () => {
            mockFetch([], { page: 1, total: 50, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(dt.state.isLoading).toBe(false));
            dt.state.meta.page = 3;
            dt.state.isLoading = false;

            const select = element.querySelector('[data-per-page]');
            select.value = '25';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            expect(dt.state.meta.page).toBe(1);
        });

        it('lanza una nueva petición fetch al cambiar perPage', async () => {
            mockFetch([], { page: 1, total: 50, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('[data-per-page]')).not.toBeNull());
            dt.state.isLoading = false;

            const select = element.querySelector('[data-per-page]');
            select.value = '25';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        });

        it('llama a window.scrollTo al cambiar perPage', async () => {
            mockFetch([], { page: 1, total: 50, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('[data-per-page]')).not.toBeNull());
            dt.state.isLoading = false;

            const select = element.querySelector('[data-per-page]');
            select.value = '25';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            expect(window.scrollTo).toHaveBeenCalled();
        });

        it('incluye el nuevo perPage en los query params del fetch', async () => {
            mockFetch([], { page: 1, total: 50, perPage: 10 });
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(element.querySelector('[data-per-page]')).not.toBeNull());
            dt.state.isLoading = false;

            const select = element.querySelector('[data-per-page]');
            select.value = '50';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
            expect(fetch.mock.calls[1][0]).toContain('limit=50');
        });
    });

    describe('formulario de filtros', () => {
        let form;

        beforeEach(() => {
            form = document.createElement('form');
            form.id = 'filter-form';
            const input = document.createElement('input');
            input.name = 'q';
            input.value = 'test';
            form.appendChild(input);
            document.body.appendChild(form);
            element.dataset.filterForm = 'filter-form';
        });

        it('inicializa los filtros con los valores actuales del formulario', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
            expect(dt.state.filters).toEqual({ q: 'test' });
        });

        it('llama a setFilters al hacer submit del formulario', async () => {
            const dt = new DataTable(element);
            const setFiltersSpy = vi.spyOn(dt, 'setFilters');
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            dt.state.isLoading = false;

            form.dispatchEvent(new Event('submit'));
            expect(setFiltersSpy).toHaveBeenCalledWith({ q: 'test' });
        });

        it('previene el submit nativo del formulario', async () => {
            const dt = new DataTable(element);
            dt.init();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

            const submitEvent = new Event('submit', { cancelable: true });
            form.dispatchEvent(submitEvent);
            expect(submitEvent.defaultPrevented).toBe(true);
        });

        it('emite aviso en consola si el formulario no existe en el DOM', () => {
            element.dataset.filterForm = 'nonexistent-form';
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const dt = new DataTable(element);
            dt.init();
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('nonexistent-form'));
        });

        describe('nueva sintaxis filterForm como objeto', () => {
            it('lee filterForm.id desde data-settings', () => {
                delete element.dataset.filterForm;
                element.dataset.settings = JSON.stringify({ filterForm: { id: 'filter-form' } });
                const dt = new DataTable(element);
                expect(dt.config.filterFormId).toBe('filter-form');
            });

            it('lee filterForm.resetButtonId desde data-settings', () => {
                element.dataset.settings = JSON.stringify({ filterForm: { id: 'filter-form', resetButtonId: 'reset-btn' } });
                const dt = new DataTable(element);
                expect(dt.config.filterResetButtonId).toBe('reset-btn');
            });

            it('filterResetButtonId es null si no se especifica', () => {
                const dt = new DataTable(element);
                expect(dt.config.filterResetButtonId).toBeNull();
            });

            it('retrocompatibilidad: filterFormId en data-settings sigue funcionando', () => {
                delete element.dataset.filterForm;
                element.dataset.settings = JSON.stringify({ filterFormId: 'filter-form' });
                const dt = new DataTable(element);
                expect(dt.config.filterFormId).toBe('filter-form');
            });
        });

        describe('botón de reset del formulario', () => {
            let resetButton;

            beforeEach(() => {
                resetButton = document.createElement('button');
                resetButton.id = 'reset-btn';
                resetButton.type = 'button';
                document.body.appendChild(resetButton);
                delete element.dataset.filterForm;
                element.dataset.settings = JSON.stringify({ filterForm: { id: 'filter-form', resetButtonId: 'reset-btn' } });
            });

            afterEach(() => {
                resetButton.remove();
            });

            it('llama a setFilters con los valores del formulario tras el reset', async () => {
                const dt = new DataTable(element);
                const setFiltersSpy = vi.spyOn(dt, 'setFilters');
                dt.init();
                await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
                dt.state.isLoading = false;

                resetButton.click();
                // Tras form.reset() los campos sin valor por defecto quedan vacíos
                expect(setFiltersSpy).toHaveBeenCalledWith({ q: '' });
            });

            it('llama a preventDefault en el evento click del botón de reset', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

                const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
                const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
                resetButton.dispatchEvent(clickEvent);
                expect(preventDefaultSpy).toHaveBeenCalled();
            });

            it('resetea el formulario al hacer click en el botón de reset', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

                const resetSpy = vi.spyOn(form, 'reset');
                resetButton.click();
                expect(resetSpy).toHaveBeenCalled();
            });

            it('vuelve a la página 1 al hacer reset', async () => {
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
                dt.state.isLoading = false;
                dt.state.meta.page = 3;

                resetButton.click();
                expect(dt.state.meta.page).toBe(1);
            });

            it('emite aviso si el botón de reset no existe en el DOM', async () => {
                resetButton.remove();
                vi.spyOn(console, 'warn').mockImplementation(() => {});
                const dt = new DataTable(element);
                dt.init();
                await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
                expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('reset-btn'));
            });
        });
    });
});
