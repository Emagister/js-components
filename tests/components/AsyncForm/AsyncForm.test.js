import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AsyncForm from '../../../src/components/AsyncForm/AsyncForm.js';
import { MessageToastType } from '../../../src/components/MessageToast/MessageToastType.js';

function createForm(innerHTML = '', attrs = {}) {
    const form = document.createElement('form');
    form.action = '/api/test';
    form.method = 'post';
    form.innerHTML = innerHTML;
    // Pre-inyectar loader para evitar instanciar Loader real
    form.loader = { show: vi.fn(), hide: vi.fn() };
    Object.entries(attrs).forEach(([k, v]) => form.setAttribute(k, v));
    return form;
}

function mockFetchOk(data = {}) {
    return vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        redirected: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(data),
    });
}

function mockFetchError(status, data = {}) {
    return vi.fn().mockResolvedValue({
        ok: false,
        status,
        redirected: false,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(data),
    });
}

describe('AsyncForm', () => {
    let element;
    let asyncForm;

    beforeEach(() => {
        element = createForm();
        document.body.appendChild(element);
        asyncForm = new AsyncForm(element);
        asyncForm.init();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('lee messageDuration del dataset', () => {
            const form = createForm('', { 'data-message-duration': '5000' });
            document.body.appendChild(form);
            const af = new AsyncForm(form);
            expect(af.settings.messageDuration).toBe(5000);
        });

        it('usa 3000ms como messageDuration por defecto', () => {
            expect(asyncForm.settings.messageDuration).toBe(3000);
        });

        it('lee la configuración desde data-settings JSON', () => {
            const form = createForm('', { 'data-settings': JSON.stringify({ messageDuration: 8000 }) });
            document.body.appendChild(form);
            const af = new AsyncForm(form);
            expect(af.settings.messageDuration).toBe(8000);
        });
    });

    describe('init()', () => {
        it('activa noValidate en el formulario', () => {
            expect(element.noValidate).toBe(true);
        });

        it('expone la API pública en root.asyncForm', () => {
            const api = element.asyncForm;
            expect(typeof api.setSettings).toBe('function');
            expect(typeof api.addNormalizer).toBe('function');
            expect(typeof api.addValidator).toBe('function');
            expect(typeof api.setSuccessHandler).toBe('function');
            expect(typeof api.setErrorHandler).toBe('function');
            expect(typeof api.reset).toBe('function');
        });

        it('los métodos de la API son encadenables', () => {
            const api = element.asyncForm;
            expect(api.setSettings({})).toBe(api);
            expect(api.addNormalizer('campo', v => v)).toBe(api);
            expect(api.addValidator(() => true)).toBe(api);
            expect(api.setSuccessHandler(() => {})).toBe(api);
            expect(api.setErrorHandler(() => {})).toBe(api);
        });

        it('emite el evento asyncForm:initialized', () => {
            const form = createForm();
            document.body.appendChild(form);
            const handler = vi.fn();
            form.addEventListener('asyncForm:initialized', handler);
            new AsyncForm(form).init();
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    describe('handleSubmit()', () => {
        it('previene el comportamiento por defecto del formulario', async () => {
            vi.stubGlobal('fetch', mockFetchOk());
            const event = new Event('submit', { cancelable: true });
            const spy = vi.spyOn(event, 'preventDefault');
            await asyncForm.handleSubmit(event);
            expect(spy).toHaveBeenCalledOnce();
        });

        it('llama a fetch con la action del formulario', async () => {
            const mockFetch = mockFetchOk();
            vi.stubGlobal('fetch', mockFetch);
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            // happy-dom resuelve la URL relativa a absoluta
            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('/api/test');
        });

        it('activa el loader durante la petición y lo desactiva al terminar', async () => {
            vi.stubGlobal('fetch', mockFetchOk());
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(element.loader.show).toHaveBeenCalledOnce();
            expect(element.loader.hide).toHaveBeenCalledOnce();
        });

        it('desactiva el loader aunque la petición falle', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(element.loader.hide).toHaveBeenCalledOnce();
        });

        it('llama al successHandler con los datos de la respuesta', async () => {
            const responseData = { id: 42, nombre: 'Test' };
            vi.stubGlobal('fetch', mockFetchOk(responseData));
            const successHandler = vi.fn();
            element.asyncForm.setSuccessHandler(successHandler);
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(successHandler).toHaveBeenCalledWith(responseData);
        });

        it('emite toast de éxito si no hay successHandler', async () => {
            vi.stubGlobal('fetch', mockFetchOk());
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'toast:show' })
            );
        });

        it('emite toast de error ante un fallo de red', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            const toastEvent = dispatchSpy.mock.calls.find(
                ([e]) => e.type === 'toast:show' && e.detail?.type === MessageToastType.ERROR
            );
            expect(toastEvent).toBeDefined();
        });

        it('cancela el envío si un validador devuelve false', async () => {
            const mockFetch = vi.fn();
            vi.stubGlobal('fetch', mockFetch);
            element.asyncForm.addValidator(() => false);
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('ejecuta todos los validadores aunque uno falle', async () => {
            const mockFetch = vi.fn();
            vi.stubGlobal('fetch', mockFetch);
            const v1 = vi.fn().mockReturnValue(false);
            const v2 = vi.fn().mockReturnValue(true);
            element.asyncForm.addValidator(v1);
            element.asyncForm.addValidator(v2);
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(v1).toHaveBeenCalledOnce();
            expect(v2).toHaveBeenCalledOnce();
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('method spoofing', () => {
        beforeEach(() => {
            vi.stubGlobal('fetch', mockFetchOk());
        });

        it.each(['PATCH', 'PUT', 'DELETE'])(
            'convierte %s a POST y añade el campo _method',
            async (method) => {
                element.dataset.method = method;
                const event = new Event('submit', { cancelable: true });
                await asyncForm.handleSubmit(event);
                const [, options] = fetch.mock.calls[0];
                expect(options.method).toBe('POST');
                expect(options.body.get('_method')).toBe(method);
            }
        );

        it('usa GET directamente sin method spoofing', async () => {
            element.method = 'get';
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            const [, options] = fetch.mock.calls[0];
            expect(options.method).toBe('GET');
            expect(options.body).toBeUndefined();
        });
    });

    describe('manejo de errores de backend', () => {
        it('llama al errorHandler si está definido', async () => {
            const errorData = { error: { message: 'Algo salió mal' } };
            vi.stubGlobal('fetch', mockFetchError(422, errorData));
            const errorHandler = vi.fn();
            element.asyncForm.setErrorHandler(errorHandler);
            const event = new Event('submit', { cancelable: true });
            await asyncForm.handleSubmit(event);
            expect(errorHandler).toHaveBeenCalledWith(errorData);
        });

        it('muestra los errores de campo cuando el backend los devuelve', async () => {
            const form = createForm('<input name="email" type="email">');
            document.body.appendChild(form);
            const af = new AsyncForm(form);
            af.init();

            vi.stubGlobal('fetch', mockFetchError(422, {
                error: { params: { email: 'Email inválido' } },
            }));

            const event = new Event('submit', { cancelable: true });
            await af.handleSubmit(event);

            const input = form.querySelector('[name="email"]');
            expect(input.classList.contains('is-invalid')).toBe(true);
            expect(form.querySelector('.form-error-message').textContent).toBe('Email inválido');
        });

        it('limpia los errores de campo al volver a enviar el formulario', async () => {
            const form = createForm('<input name="email" type="email">');
            document.body.appendChild(form);
            const af = new AsyncForm(form);
            af.init();

            // Primer envío con error
            vi.stubGlobal('fetch', mockFetchError(422, {
                error: { params: { email: 'Email inválido' } },
            }));
            await af.handleSubmit(new Event('submit', { cancelable: true }));

            // Segundo envío correcto
            vi.stubGlobal('fetch', mockFetchOk());
            await af.handleSubmit(new Event('submit', { cancelable: true }));

            expect(form.querySelector('.is-invalid')).toBeNull();
            expect(form.querySelector('.form-error-message')).toBeNull();
        });
    });

    describe('normalizers', () => {
        it('aplica un normalizador personalizado al campo indicado', async () => {
            const form = createForm('<input name="codigo" value="  ABC  ">');
            document.body.appendChild(form);
            const af = new AsyncForm(form);
            af.init();
            form.asyncForm.addNormalizer('codigo', (val) => val.trim().toLowerCase());

            let capturedBody;
            vi.stubGlobal('fetch', vi.fn().mockImplementation((url, opts) => {
                capturedBody = opts.body;
                return Promise.resolve({
                    ok: true, status: 200, redirected: false,
                    headers: { get: () => 'application/json' },
                    json: () => Promise.resolve({}),
                });
            }));

            await af.handleSubmit(new Event('submit', { cancelable: true }));
            expect(capturedBody.get('codigo')).toBe('abc');
        });
    });

    describe('reset()', () => {
        it('llama al método reset() del formulario nativo', () => {
            const spy = vi.spyOn(element, 'reset');
            asyncForm.reset();
            expect(spy).toHaveBeenCalledOnce();
        });

        it('elimina las clases de error is-invalid', () => {
            const input = document.createElement('input');
            input.classList.add('is-invalid');
            element.appendChild(input);
            asyncForm.reset();
            expect(input.classList.contains('is-invalid')).toBe(false);
        });

        it('elimina los mensajes de error del DOM', () => {
            const msg = document.createElement('span');
            msg.className = 'form-error-message';
            element.appendChild(msg);
            asyncForm.reset();
            expect(element.querySelector('.form-error-message')).toBeNull();
        });
    });
});
