import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessageToastType } from '../../../src/components/MessageToast/MessageToastType.js';

// Mock de Bootstrap Toast (función regular para poder usarse con `new`)
const mockShow = vi.fn();
const mockHide = vi.fn();
const MockToast = vi.fn(function () {
    this.show = mockShow;
    this.hide = mockHide;
    this.dispose = vi.fn();
});

vi.mock('bootstrap', () => ({ Toast: MockToast }));

// Importar después del mock
const { default: MessageToast } = await import('../../../src/components/MessageToast/MessageToast.js');

function createElement(options = {}) {
    const el = document.createElement('div');
    const msg = document.createElement('span');
    msg.dataset.toastMessage = '';
    el.appendChild(msg);
    if (options.mode) el.dataset.mode = options.mode;
    if (options.duration) el.dataset.duration = String(options.duration);
    if (options.settings) el.dataset.settings = JSON.stringify(options.settings);
    return el;
}

describe('MessageToast', () => {
    let element;
    let toast;

    beforeEach(() => {
        vi.clearAllMocks();
        element = createElement();
        document.body.appendChild(element);
        toast = new MessageToast(element);
        toast.init();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('lee el mode del dataset', () => {
            const el = createElement({ mode: 'local' });
            const t = new MessageToast(el);
            expect(t.settings.mode).toBe('local');
        });

        it('usa mode "global" por defecto', () => {
            expect(toast.settings.mode).toBe('global');
        });

        it('lee la duration del dataset', () => {
            const el = createElement({ duration: 5000 });
            const t = new MessageToast(el);
            expect(t.settings.duration).toBe(5000);
        });

        it('lee la configuración desde data-settings JSON', () => {
            const el = createElement({ settings: { mode: 'local', duration: 7000 } });
            const t = new MessageToast(el);
            expect(t.settings.mode).toBe('local');
            expect(t.settings.duration).toBe(7000);
        });
    });

    describe('init()', () => {
        it('crea una instancia de Bootstrap Toast con autohide:false', () => {
            expect(MockToast).toHaveBeenCalledWith(element, { autohide: false });
        });

        it('expone la API pública en root.messageToast', () => {
            expect(typeof element.messageToast.show).toBe('function');
            expect(typeof element.messageToast.hide).toBe('function');
        });

        it('emite el evento messageToast:initialized', () => {
            const el = createElement();
            document.body.appendChild(el);
            const handler = vi.fn();
            el.addEventListener('messageToast:initialized', handler);
            const t = new MessageToast(el);
            t.init();
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    describe('show()', () => {
        it('establece el texto del mensaje', () => {
            toast.show('Operación completada', MessageToastType.SUCCESS);
            expect(element.querySelector('[data-toast-message]').textContent).toBe('Operación completada');
        });

        it('añade la clase de tipo correcta', () => {
            toast.show('Test', MessageToastType.ERROR);
            expect(element.classList.contains('is-error')).toBe(true);
        });

        it('elimina la clase de tipo anterior antes de añadir la nueva', () => {
            toast.show('Test', MessageToastType.SUCCESS);
            toast.show('Test', MessageToastType.WARNING);
            expect(element.classList.contains('is-success')).toBe(false);
            expect(element.classList.contains('is-warning')).toBe(true);
        });

        it('llama a bootstrap toast.show()', () => {
            toast.show('Test');
            expect(mockShow).toHaveBeenCalledOnce();
        });

        it('oculta automáticamente tras la duración indicada', () => {
            vi.useFakeTimers();
            const hideSpy = vi.spyOn(toast, 'hide');
            toast.show('Test', MessageToastType.SUCCESS, 2000);
            vi.advanceTimersByTime(2000);
            expect(hideSpy).toHaveBeenCalledOnce();
        });

        it('no oculta automáticamente cuando duration es -1', () => {
            vi.useFakeTimers();
            const hideSpy = vi.spyOn(toast, 'hide');
            toast.show('Test', MessageToastType.SUCCESS, -1);
            vi.advanceTimersByTime(60000);
            expect(hideSpy).not.toHaveBeenCalled();
        });

        it('cancela el temporizador anterior al mostrar de nuevo', () => {
            vi.useFakeTimers();
            const hideSpy = vi.spyOn(toast, 'hide');
            toast.show('Primero', MessageToastType.SUCCESS, 3000);
            vi.advanceTimersByTime(1000);
            toast.show('Segundo', MessageToastType.SUCCESS, 3000);
            vi.advanceTimersByTime(2500); // 3500ms desde el primero → no debe haberse ocultado aún
            expect(hideSpy).not.toHaveBeenCalled();
            vi.advanceTimersByTime(500); // 3000ms desde el segundo → ahora sí
            expect(hideSpy).toHaveBeenCalledOnce();
        });
    });

    describe('hide()', () => {
        it('llama a bootstrap toast.hide()', () => {
            toast.hide();
            expect(mockHide).toHaveBeenCalledOnce();
        });
    });

    describe('modo global', () => {
        it('responde al evento window toast:show', () => {
            const showSpy = vi.spyOn(toast, 'show');
            window.dispatchEvent(new CustomEvent('toast:show', {
                detail: { message: 'Global!', type: MessageToastType.WARNING, duration: 4000 },
            }));
            expect(showSpy).toHaveBeenCalledWith('Global!', MessageToastType.WARNING, 4000);
        });

        it('usa valores por defecto en el evento si no se proporcionan', () => {
            const showSpy = vi.spyOn(toast, 'show');
            window.dispatchEvent(new CustomEvent('toast:show', {
                detail: { message: 'Sin tipo' },
            }));
            expect(showSpy).toHaveBeenCalledWith('Sin tipo', MessageToastType.SUCCESS, 3000);
        });

        it('en modo local NO responde al evento window toast:show', () => {
            const el = createElement({ mode: 'local' });
            document.body.appendChild(el);
            const localToast = new MessageToast(el);
            localToast.init();
            const showSpy = vi.spyOn(localToast, 'show');
            window.dispatchEvent(new CustomEvent('toast:show', {
                detail: { message: 'Test' },
            }));
            expect(showSpy).not.toHaveBeenCalled();
        });
    });
});
