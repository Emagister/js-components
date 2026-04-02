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
    });
});
