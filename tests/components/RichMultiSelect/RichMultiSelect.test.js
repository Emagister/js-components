import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('tom-select', () => ({
    default: vi.fn()
}));

vi.mock('../../../src/components/RichMultiSelect/_rich-multi-select.scss', () => ({}));

import TomSelect from 'tom-select';
import RichMultiSelect from '../../../src/components/RichMultiSelect/RichMultiSelect.js';

describe('RichMultiSelect', () => {
    let element;
    let rms;

    beforeEach(() => {
        element = document.createElement('select');
        element.setAttribute('multiple', '');
        document.body.appendChild(element);

        TomSelect.mockImplementation(function (el, config) {
            this._config = config;
            this.getValue = vi.fn(() => []);
            this.setValue = vi.fn();
            this.addOption = vi.fn();
            this.clear = vi.fn();
            this.destroy = vi.fn();
        });

        rms = new RichMultiSelect(element);
    });

    afterEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    const getTsInstance = () => TomSelect.mock.results[TomSelect.mock.results.length - 1].value;
    const getTsConfig = () => TomSelect.mock.calls[TomSelect.mock.calls.length - 1][1];

    // ─── init() ──────────────────────────────────────────────────────────────

    describe('init()', () => {
        it('expone la API pública en element.richMultiSelect', () => {
            rms.init();
            expect(typeof element.richMultiSelect.getValue).toBe('function');
            expect(typeof element.richMultiSelect.setValue).toBe('function');
            expect(typeof element.richMultiSelect.addOption).toBe('function');
            expect(typeof element.richMultiSelect.clear).toBe('function');
            expect(typeof element.richMultiSelect.destroy).toBe('function');
        });

        it('emite el evento emg-jsc:richMultiSelect:initialized', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:initialized', handler);
            rms.init();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('usa placeholder por defecto cuando no hay configuración', () => {
            rms.init();
            expect(getTsConfig().placeholder).toBe('Seleccionar…');
        });

        it('usa el placeholder de data-settings', () => {
            element.dataset.settings = JSON.stringify({ placeholder: 'Buscar centros…' });
            new RichMultiSelect(element).init();
            expect(getTsConfig().placeholder).toBe('Buscar centros…');
        });

        it('maxItems es null por defecto', () => {
            rms.init();
            expect(getTsConfig().maxItems).toBeNull();
        });

        it('usa maxItems de data-settings', () => {
            element.dataset.settings = JSON.stringify({ maxItems: 5 });
            new RichMultiSelect(element).init();
            expect(getTsConfig().maxItems).toBe(5);
        });

        it('create es false por defecto', () => {
            rms.init();
            expect(getTsConfig().create).toBe(false);
        });

        it('permite activar create desde data-settings', () => {
            element.dataset.settings = JSON.stringify({ create: true });
            new RichMultiSelect(element).init();
            expect(getTsConfig().create).toBe(true);
        });

        it('searchField por defecto es "text"', () => {
            rms.init();
            expect(getTsConfig().searchField).toBe('text');
        });

        it('incluye el plugin remove_button para mostrar el botón × en cada tag', () => {
            rms.init();
            expect(getTsConfig().plugins).toContain('remove_button');
        });
    });

    // ─── API pública ──────────────────────────────────────────────────────────

    describe('API pública', () => {
        beforeEach(() => {
            rms.init();
        });

        it('getValue() devuelve los valores de TomSelect', () => {
            getTsInstance().getValue.mockReturnValue(['1', '2']);
            expect(element.richMultiSelect.getValue()).toEqual(['1', '2']);
        });

        it('setValue() delega en TomSelect.setValue', () => {
            element.richMultiSelect.setValue(['3', '4']);
            expect(getTsInstance().setValue).toHaveBeenCalledWith(['3', '4']);
        });

        it('addOption() delega en TomSelect.addOption', () => {
            element.richMultiSelect.addOption({ value: '99', text: 'Centro Nuevo' });
            expect(getTsInstance().addOption).toHaveBeenCalledWith({ value: '99', text: 'Centro Nuevo' });
        });

        it('clear() delega en TomSelect.clear', () => {
            element.richMultiSelect.clear();
            expect(getTsInstance().clear).toHaveBeenCalledOnce();
        });
    });

    // ─── destroy() ───────────────────────────────────────────────────────────

    describe('destroy()', () => {
        it('llama a TomSelect.destroy()', () => {
            rms.init();
            element.richMultiSelect.destroy();
            expect(getTsInstance().destroy).toHaveBeenCalledOnce();
        });

        it('elimina la API pública del elemento', () => {
            rms.init();
            element.richMultiSelect.destroy();
            expect(element.richMultiSelect).toBeUndefined();
        });
    });

    // ─── Eventos ──────────────────────────────────────────────────────────────

    describe('eventos', () => {
        beforeEach(() => {
            rms.init();
        });

        it('dispara emg-jsc:richMultiSelect:change al cambiar la selección', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:change', handler);
            getTsConfig().onChange(['1', '2']);
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0].detail).toEqual({ values: ['1', '2'] });
        });

        it('dispara emg-jsc:richMultiSelect:item-add al añadir un ítem', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:item-add', handler);
            const $item = document.createElement('div');
            $item.textContent = 'Centro Madrid';
            getTsConfig().onItemAdd('1', $item);
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0].detail).toEqual({ value: '1', text: 'Centro Madrid' });
        });

        it('dispara emg-jsc:richMultiSelect:item-remove al eliminar un ítem', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:item-remove', handler);
            getTsConfig().onItemRemove('1');
            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0].detail).toEqual({ value: '1' });
        });

        it('dispara emg-jsc:richMultiSelect:focus al abrir el desplegable', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:focus', handler);
            getTsConfig().onFocus();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('dispara emg-jsc:richMultiSelect:blur al cerrar el desplegable', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:blur', handler);
            getTsConfig().onBlur();
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    // ─── Carga remota ─────────────────────────────────────────────────────────

    describe('carga remota', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            global.fetch = vi.fn();
        });

        afterEach(() => {
            vi.useRealTimers();
            delete global.fetch;
        });

        it('no incluye la función load cuando no hay remoteUrl', () => {
            rms.init();
            expect(getTsConfig().load).toBeUndefined();
        });

        it('incluye la función load cuando se define remoteUrl', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();
            expect(typeof getTsConfig().load).toBe('function');
        });

        it('llama a callback con [] si la búsqueda tiene menos de 2 caracteres', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();
            const callback = vi.fn();
            getTsConfig().load('a', callback);
            expect(callback).toHaveBeenCalledWith([]);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('aplica debounce: no llama a fetch antes de 300ms', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();
            const callback = vi.fn();

            getTsConfig().load('madrid', callback);
            vi.advanceTimersByTime(299);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('aplica debounce: llama a fetch exactamente a los 300ms', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();
            const callback = vi.fn();

            getTsConfig().load('madrid', callback);
            vi.advanceTimersByTime(300);
            expect(global.fetch).toHaveBeenCalledWith('/api/search?q=madrid');
        });

        it('mapea resultados usando los campos por defecto (id / name)', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    { id: '1', name: 'Centro Madrid' },
                    { id: '2', name: 'Centro Barcelona' }
                ]
            });

            const callback = vi.fn();
            getTsConfig().load('madrid', callback);
            await vi.advanceTimersByTimeAsync(300);

            expect(callback).toHaveBeenCalledWith([
                { value: '1', text: 'Centro Madrid' },
                { value: '2', text: 'Centro Barcelona' }
            ]);
        });

        it('usa remoteValueField y remoteLabelField personalizados', async () => {
            element.dataset.settings = JSON.stringify({
                remoteUrl: '/api/search',
                remoteValueField: 'uuid',
                remoteLabelField: 'title'
            });
            new RichMultiSelect(element).init();

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [{ uuid: 'abc', title: 'Test Item' }]
            });

            const callback = vi.fn();
            getTsConfig().load('test', callback);
            await vi.advanceTimersByTimeAsync(300);

            expect(callback).toHaveBeenCalledWith([{ value: 'abc', text: 'Test Item' }]);
        });

        it('llama a callback con [] cuando la respuesta HTTP no es ok', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();

            global.fetch.mockResolvedValue({ ok: false });

            const callback = vi.fn();
            getTsConfig().load('madrid', callback);
            await vi.advanceTimersByTimeAsync(300);

            expect(callback).toHaveBeenCalledWith([]);
        });

        it('emite load-error cuando la respuesta HTTP no es ok', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();

            global.fetch.mockResolvedValue({ ok: false });

            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:load-error', handler);

            getTsConfig().load('madrid', vi.fn());
            await vi.advanceTimersByTimeAsync(300);

            expect(handler).toHaveBeenCalledOnce();
        });

        it('llama a callback con [] cuando la petición lanza un error de red', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();

            global.fetch.mockRejectedValue(new Error('Network error'));

            const callback = vi.fn();
            getTsConfig().load('madrid', callback);
            await vi.advanceTimersByTimeAsync(300);

            expect(callback).toHaveBeenCalledWith([]);
        });

        it('emite load-error cuando la petición lanza un error de red', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            new RichMultiSelect(element).init();

            global.fetch.mockRejectedValue(new Error('Network error'));

            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:load-error', handler);

            getTsConfig().load('madrid', vi.fn());
            await vi.advanceTimersByTimeAsync(300);

            expect(handler).toHaveBeenCalledOnce();
        });

        it('no emite load-error ni llama a callback tras destroy con fetch en vuelo', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            const instance = new RichMultiSelect(element);
            instance.init();

            let resolveFetch;
            global.fetch.mockReturnValue(new Promise(resolve => { resolveFetch = resolve; }));

            const callback = vi.fn();
            const errorHandler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:load-error', errorHandler);

            getTsConfig().load('madrid', callback);
            await vi.advanceTimersByTimeAsync(300);

            element.richMultiSelect.destroy();

            resolveFetch({ ok: false });
            await Promise.resolve();

            expect(errorHandler).not.toHaveBeenCalled();
            expect(callback).not.toHaveBeenCalled();
        });

        it('no llama a callback con resultados tras destroy con fetch en vuelo', async () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            const instance = new RichMultiSelect(element);
            instance.init();

            let resolveFetch;
            global.fetch.mockReturnValue(new Promise(resolve => { resolveFetch = resolve; }));

            const callback = vi.fn();
            getTsConfig().load('madrid', callback);
            await vi.advanceTimersByTimeAsync(300);

            element.richMultiSelect.destroy();

            resolveFetch({
                ok: true,
                json: async () => [{ id: '1', name: 'Centro Madrid' }]
            });
            await Promise.resolve();
            await Promise.resolve();

            expect(callback).not.toHaveBeenCalledWith([{ value: '1', text: 'Centro Madrid' }]);
        });
    });

    // ─── constructor ──────────────────────────────────────────────────────────

    describe('constructor()', () => {
        it('usa {} como settings cuando data-settings contiene JSON malformado', () => {
            const el = document.createElement('select');
            el.setAttribute('multiple', '');
            el.dataset.settings = '{invalid json}';
            const instance = new RichMultiSelect(el);
            instance.init();
            expect(getTsConfig().placeholder).toBe('Seleccionar…');
        });
    });
});
