import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock de Bootstrap Modal (función regular para poder usarse con `new`)
const mockModalShow = vi.fn();
const mockModalHide = vi.fn();
const MockBootstrapModal = vi.fn(function () {
    this.show = mockModalShow;
    this.hide = mockModalHide;
    this.dispose = vi.fn();
});

vi.mock('bootstrap', () => ({ Modal: MockBootstrapModal }));

const { default: Confirm } = await import('../../../src/components/Confirm/Confirm.js');

function createConfirmElement() {
    const el = document.createElement('div');
    el.innerHTML = `
        <span data-confirm-title></span>
        <span data-confirm-message></span>
        <button data-confirm-btn>Confirmar</button>
        <button data-cancel-btn>Cancelar</button>
    `;
    return el;
}

describe('Confirm', () => {
    let element;
    let confirm;

    beforeEach(() => {
        vi.clearAllMocks();
        element = createConfirmElement();
        document.body.appendChild(element);
        confirm = new Confirm(element);
        confirm.init();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        delete window.confirmCustom;
    });

    describe('constructor', () => {
        it('localiza los elementos internos', () => {
            const c = new Confirm(createConfirmElement());
            expect(c.titleEl).not.toBeNull();
            expect(c.messageEl).not.toBeNull();
            expect(c.confirmBtn).not.toBeNull();
            expect(c.cancelBtn).not.toBeNull();
        });
    });

    describe('init()', () => {
        it('registra window.confirmCustom como función', () => {
            expect(typeof window.confirmCustom).toBe('function');
        });

        it('emite el evento confirm:initialized', () => {
            const el = createConfirmElement();
            document.body.appendChild(el);
            const handler = vi.fn();
            el.addEventListener('confirm:initialized', handler);
            new Confirm(el).init();
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    describe('ask()', () => {
        it('establece el mensaje en el elemento correspondiente', () => {
            confirm.ask('¿Eliminar este registro?', 'Atención');
            expect(confirm.messageEl.textContent).toBe('¿Eliminar este registro?');
        });

        it('establece el título en el elemento correspondiente', () => {
            confirm.ask('Mensaje', 'Mi Título');
            expect(confirm.titleEl.textContent).toBe('Mi Título');
        });

        it('devuelve una Promise', () => {
            const result = confirm.ask('Test');
            expect(result).toBeInstanceOf(Promise);
        });

        it('muestra el modal al llamar ask()', () => {
            confirm.ask('Test');
            expect(mockModalShow).toHaveBeenCalledOnce();
        });

        it('resuelve con true al pulsar el botón de confirmación', async () => {
            const promise = confirm.ask('¿Seguro?');
            confirm.confirmBtn.click();
            await expect(promise).resolves.toBe(true);
        });

        it('resuelve con false al pulsar el botón de cancelación', async () => {
            const promise = confirm.ask('¿Seguro?');
            confirm.cancelBtn.click();
            await expect(promise).resolves.toBe(false);
        });

        it('oculta el modal al confirmar', async () => {
            const promise = confirm.ask('Test');
            confirm.confirmBtn.click();
            await promise;
            expect(mockModalHide).toHaveBeenCalledOnce();
        });

        it('oculta el modal al cancelar', async () => {
            const promise = confirm.ask('Test');
            confirm.cancelBtn.click();
            await promise;
            expect(mockModalHide).toHaveBeenCalledOnce();
        });

        it('limpia la referencia al resolver tras confirmar', async () => {
            const promise = confirm.ask('Test');
            confirm.confirmBtn.click();
            await promise;
            expect(confirm.resolve).toBeNull();
        });
    });

    describe('window.confirmCustom()', () => {
        it('llama internamente a ask()', () => {
            const askSpy = vi.spyOn(confirm, 'ask');
            window.confirmCustom('¿Borrar?', 'Confirmar');
            expect(askSpy).toHaveBeenCalledWith('¿Borrar?', 'Confirmar');
        });

        it('usa "Confirmar" como título por defecto', () => {
            const askSpy = vi.spyOn(confirm, 'ask');
            window.confirmCustom('Mensaje');
            expect(askSpy).toHaveBeenCalledWith('Mensaje', 'Confirmar');
        });
    });
});
