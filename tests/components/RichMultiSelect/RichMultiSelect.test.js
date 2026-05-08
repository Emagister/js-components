import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockTomSelectInstance, MockTomSelect } = vi.hoisted(() => {
    const mockTomSelectInstance = {
        getValue: vi.fn(() => []),
        setValue: vi.fn(),
        addOption: vi.fn(),
        clear: vi.fn(),
        destroy: vi.fn(),
        _config: null,
    };

    // Debe ser function regular (no arrow) para poder usarse con `new`
    const MockTomSelect = vi.fn(function (element, config) {
        mockTomSelectInstance._config = config;
        return mockTomSelectInstance;
    });

    return { mockTomSelectInstance, MockTomSelect };
});

vi.mock('tom-select', () => ({ default: MockTomSelect }));
vi.mock('../../../src/components/RichMultiSelect/_rich-multi-select.scss', () => ({}));

import RichMultiSelect from '../../../src/components/RichMultiSelect/RichMultiSelect.js';

describe('RichMultiSelect', () => {
    let element;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTomSelectInstance._config = null;
        mockTomSelectInstance.getValue.mockReturnValue([]);

        element = document.createElement('select');
        element.multiple = true;
        document.body.appendChild(element);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('usa placeholder "Seleccionar…" por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.placeholder).toBe('Seleccionar…');
        });

        it('usa maxItems null por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.maxItems).toBeNull();
        });

        it('usa searchField "text" por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.searchField).toBe('text');
        });

        it('usa noResultsText "Sin resultados" por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.noResultsText).toBe('Sin resultados');
        });

        it('usa create false por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.create).toBe(false);
        });

        it('usa remoteUrl null por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.remoteUrl).toBeNull();
        });

        it('usa remoteValueField "id" por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.remoteValueField).toBe('id');
        });

        it('usa remoteLabelField "name" por defecto', () => {
            const rms = new RichMultiSelect(element);
            expect(rms.config.remoteLabelField).toBe('name');
        });

        it('lee configuración desde data-settings', () => {
            element.dataset.settings = JSON.stringify({
                placeholder: 'Buscar centros…',
                maxItems: 10,
                create: true,
            });
            const rms = new RichMultiSelect(element);
            expect(rms.config.placeholder).toBe('Buscar centros…');
            expect(rms.config.maxItems).toBe(10);
            expect(rms.config.create).toBe(true);
        });

        it('lee remoteUrl desde data-settings', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            const rms = new RichMultiSelect(element);
            expect(rms.config.remoteUrl).toBe('/api/search');
        });

        it('lee noResultsText personalizado desde data-settings', () => {
            element.dataset.settings = JSON.stringify({ noResultsText: 'No hay opciones' });
            const rms = new RichMultiSelect(element);
            expect(rms.config.noResultsText).toBe('No hay opciones');
        });
    });

    describe('init()', () => {
        it('inicializa TomSelect sobre el elemento raíz', () => {
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(MockTomSelect).toHaveBeenCalledOnce();
            expect(MockTomSelect.mock.calls[0][0]).toBe(element);
        });

        it('pasa placeholder a TomSelect', () => {
            element.dataset.settings = JSON.stringify({ placeholder: 'Buscar…' });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.placeholder).toBe('Buscar…');
        });

        it('pasa maxItems a TomSelect', () => {
            element.dataset.settings = JSON.stringify({ maxItems: 5 });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.maxItems).toBe(5);
        });

        it('pasa create a TomSelect', () => {
            element.dataset.settings = JSON.stringify({ create: true });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.create).toBe(true);
        });

        it('incluye el plugin remove_button', () => {
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.plugins).toContain('remove_button');
        });

        it('pasa searchField como array a TomSelect', () => {
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.searchField).toEqual(['text']);
        });

        it('permite múltiples campos de búsqueda separados por coma', () => {
            element.dataset.settings = JSON.stringify({ searchField: 'text,value' });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.searchField).toEqual(['text', 'value']);
        });

        it('expone la API pública en root.richMultiSelect', () => {
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(typeof element.richMultiSelect.getValue).toBe('function');
            expect(typeof element.richMultiSelect.setValue).toBe('function');
            expect(typeof element.richMultiSelect.addOption).toBe('function');
            expect(typeof element.richMultiSelect.clear).toBe('function');
            expect(typeof element.richMultiSelect.destroy).toBe('function');
        });

        it('despacha el evento emg-jsc:richMultiSelect:initialized', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:initialized', handler);
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('no configura load cuando no hay remoteUrl', () => {
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.load).toBeUndefined();
        });

        it('configura load cuando hay remoteUrl', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(typeof mockTomSelectInstance._config.load).toBe('function');
        });

        it('configura valueField y labelField con valores por defecto cuando hay remoteUrl', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.valueField).toBe('id');
            expect(mockTomSelectInstance._config.labelField).toBe('name');
        });

        it('configura valueField y labelField personalizados cuando hay remoteUrl', () => {
            element.dataset.settings = JSON.stringify({
                remoteUrl: '/api/search',
                remoteValueField: 'code',
                remoteLabelField: 'title',
            });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.valueField).toBe('code');
            expect(mockTomSelectInstance._config.labelField).toBe('title');
        });

        it('configura loadThrottle a 300 cuando hay remoteUrl', () => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/search' });
            const rms = new RichMultiSelect(element);
            rms.init();
            expect(mockTomSelectInstance._config.loadThrottle).toBe(300);
        });
    });

    describe('render no_results', () => {
        it('usa "Sin resultados" por defecto', () => {
            const rms = new RichMultiSelect(element);
            rms.init();
            const html = mockTomSelectInstance._config.render.no_results();
            expect(html).toContain('Sin resultados');
        });

        it('usa el noResultsText configurado', () => {
            element.dataset.settings = JSON.stringify({ noResultsText: 'No hay opciones' });
            const rms = new RichMultiSelect(element);
            rms.init();
            const html = mockTomSelectInstance._config.render.no_results();
            expect(html).toContain('No hay opciones');
        });
    });

    describe('API pública', () => {
        beforeEach(() => {
            const rms = new RichMultiSelect(element);
            rms.init();
        });

        it('getValue() retorna el array de valores seleccionados', () => {
            mockTomSelectInstance.getValue.mockReturnValue(['1', '3']);
            expect(element.richMultiSelect.getValue()).toEqual(['1', '3']);
        });

        it('getValue() normaliza string a array para control de un solo ítem', () => {
            mockTomSelectInstance.getValue.mockReturnValue('1');
            expect(element.richMultiSelect.getValue()).toEqual(['1']);
        });

        it('getValue() retorna array vacío cuando no hay selección', () => {
            mockTomSelectInstance.getValue.mockReturnValue('');
            expect(element.richMultiSelect.getValue()).toEqual([]);
        });

        it('setValue() llama a setValue de TomSelect', () => {
            element.richMultiSelect.setValue(['2', '4']);
            expect(mockTomSelectInstance.setValue).toHaveBeenCalledWith(['2', '4']);
        });

        it('addOption() llama a addOption de TomSelect', () => {
            element.richMultiSelect.addOption({ value: '99', text: 'Centro Nuevo' });
            expect(mockTomSelectInstance.addOption).toHaveBeenCalledWith({ value: '99', text: 'Centro Nuevo' });
        });

        it('clear() llama a clear de TomSelect', () => {
            element.richMultiSelect.clear();
            expect(mockTomSelectInstance.clear).toHaveBeenCalled();
        });

        it('destroy() llama a destroy de TomSelect', () => {
            element.richMultiSelect.destroy();
            expect(mockTomSelectInstance.destroy).toHaveBeenCalled();
        });

        it('destroy() elimina richMultiSelect del elemento', () => {
            element.richMultiSelect.destroy();
            expect(element.richMultiSelect).toBeUndefined();
        });
    });

    describe('eventos', () => {
        let config;

        beforeEach(() => {
            const rms = new RichMultiSelect(element);
            rms.init();
            config = mockTomSelectInstance._config;
        });

        describe('emg-jsc:richMultiSelect:change', () => {
            it('se emite al llamar onChange con array de valores', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:change', handler);
                config.onChange(['1', '2']);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ values: ['1', '2'] });
            });

            it('normaliza string a array en el evento change', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:change', handler);
                config.onChange('1');
                expect(handler.mock.calls[0][0].detail).toEqual({ values: ['1'] });
            });

            it('retorna array vacío cuando onChange recibe string vacío', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:change', handler);
                config.onChange('');
                expect(handler.mock.calls[0][0].detail).toEqual({ values: [] });
            });
        });

        describe('emg-jsc:richMultiSelect:item-add', () => {
            it('se emite al llamar onItemAdd con value y $item', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:item-add', handler);
                const $item = document.createElement('div');
                $item.textContent = 'Centro Madrid';
                config.onItemAdd('1', $item);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ value: '1', text: 'Centro Madrid' });
            });
        });

        describe('emg-jsc:richMultiSelect:item-remove', () => {
            it('se emite al llamar onItemRemove con value', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:item-remove', handler);
                config.onItemRemove('1');
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ value: '1' });
            });
        });

        describe('emg-jsc:richMultiSelect:focus', () => {
            it('se emite al llamar onFocus', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:focus', handler);
                config.onFocus();
                expect(handler).toHaveBeenCalledOnce();
            });
        });

        describe('emg-jsc:richMultiSelect:blur', () => {
            it('se emite al llamar onBlur', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:richMultiSelect:blur', handler);
                config.onBlur();
                expect(handler).toHaveBeenCalledOnce();
            });
        });
    });

    describe('carga remota', () => {
        let loadFn;

        beforeEach(() => {
            element.dataset.settings = JSON.stringify({ remoteUrl: '/api/centers/search' });
            const rms = new RichMultiSelect(element);
            rms.init();
            loadFn = mockTomSelectInstance._config.load;

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ id: '1', name: 'Centro Madrid' }]),
            });
        });

        it('no llama a fetch si la query está vacía', () => {
            const callback = vi.fn();
            loadFn('', callback);
            expect(fetch).not.toHaveBeenCalled();
            expect(callback).toHaveBeenCalledOnce();
        });

        it('no llama a fetch si la query tiene un solo carácter', () => {
            const callback = vi.fn();
            loadFn('a', callback);
            expect(fetch).not.toHaveBeenCalled();
            expect(callback).toHaveBeenCalledOnce();
        });

        it('llama a fetch cuando la query tiene 2 o más caracteres', async () => {
            const callback = vi.fn();
            loadFn('ma', callback);
            await vi.waitFor(() => expect(callback).toHaveBeenCalled());
            expect(fetch).toHaveBeenCalledOnce();
        });

        it('construye la URL correctamente con el parámetro q', async () => {
            const callback = vi.fn();
            loadFn('ma', callback);
            await vi.waitFor(() => expect(callback).toHaveBeenCalled());
            expect(fetch).toHaveBeenCalledWith('/api/centers/search?q=ma');
        });

        it('codifica correctamente caracteres especiales en la query', async () => {
            const callback = vi.fn();
            loadFn('mad rid', callback);
            await vi.waitFor(() => expect(callback).toHaveBeenCalled());
            expect(fetch).toHaveBeenCalledWith('/api/centers/search?q=mad%20rid');
        });

        it('llama a callback con los datos recibidos del servidor', async () => {
            const callback = vi.fn();
            loadFn('ma', callback);
            await vi.waitFor(() => expect(callback).toHaveBeenCalled());
            expect(callback).toHaveBeenCalledWith([{ id: '1', name: 'Centro Madrid' }]);
        });

        it('emite emg-jsc:richMultiSelect:load-error cuando la respuesta no es ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:load-error', handler);

            const callback = vi.fn();
            loadFn('ma', callback);
            await vi.waitFor(() => expect(handler).toHaveBeenCalled());
            expect(callback).toHaveBeenCalled();
        });

        it('emite emg-jsc:richMultiSelect:load-error cuando falla la red', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richMultiSelect:load-error', handler);

            const callback = vi.fn();
            loadFn('ma', callback);
            await vi.waitFor(() => expect(handler).toHaveBeenCalled());
            expect(callback).toHaveBeenCalled();
        });

        it('llama a callback sin argumentos al manejar un error de red', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
            const callback = vi.fn();
            loadFn('ma', callback);
            await vi.waitFor(() => expect(callback).toHaveBeenCalled());
            expect(callback).toHaveBeenCalledWith();
        });
    });
});
