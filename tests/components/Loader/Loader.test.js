import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Loader from '../../../src/components/Loader/Loader.js';

describe('Loader', () => {
    let element;
    let loader;

    beforeEach(() => {
        element = document.createElement('div');
        document.body.appendChild(element);
        loader = new Loader(element);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('init()', () => {
        it('crea el overlay dentro del elemento raíz', () => {
            loader.init();
            expect(element.querySelector('.loader-overlay')).not.toBeNull();
        });

        it('crea el spinner con role="status"', () => {
            loader.init();
            const spinner = element.querySelector('.loader-spinner');
            expect(spinner).not.toBeNull();
            expect(spinner.getAttribute('role')).toBe('status');
        });

        it('incluye texto para lectores de pantalla', () => {
            loader.init();
            const srOnly = element.querySelector('.visually-hidden');
            expect(srOnly).not.toBeNull();
            expect(srOnly.textContent).toBe('Cargando...');
        });

        it('expone la API pública en root.loader', () => {
            loader.init();
            expect(typeof element.loader.show).toBe('function');
            expect(typeof element.loader.hide).toBe('function');
        });

        it('emite el evento emg-jsc:loader:initialized', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:loader:initialized', handler);
            loader.init();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('reutiliza el overlay si ya existe en el DOM', () => {
            const existing = document.createElement('div');
            existing.className = 'loader-overlay';
            element.appendChild(existing);

            loader.init();

            expect(element.querySelectorAll('.loader-overlay')).toHaveLength(1);
            expect(loader.overlay).toBe(existing);
        });
    });

    describe('show()', () => {
        it('añade la clase is-visible al overlay', () => {
            loader.init();
            loader.show();
            expect(loader.overlay.classList.contains('is-visible')).toBe(true);
        });

        it('no falla si se llama antes de init()', () => {
            expect(() => loader.show()).not.toThrow();
        });
    });

    describe('hide()', () => {
        it('elimina la clase is-visible del overlay', () => {
            loader.init();
            loader.show();
            loader.hide();
            expect(loader.overlay.classList.contains('is-visible')).toBe(false);
        });

        it('no falla si se llama antes de show()', () => {
            loader.init();
            expect(() => loader.hide()).not.toThrow();
        });
    });

    describe('eventos del DOM', () => {
        it('muestra el overlay al recibir emg-jsc:loader:show', () => {
            loader.init();
            element.dispatchEvent(new Event('emg-jsc:loader:show'));
            expect(loader.overlay.classList.contains('is-visible')).toBe(true);
        });

        it('oculta el overlay al recibir emg-jsc:loader:hide', () => {
            loader.init();
            loader.show();
            element.dispatchEvent(new Event('emg-jsc:loader:hide'));
            expect(loader.overlay.classList.contains('is-visible')).toBe(false);
        });
    });

    describe('posicionamiento', () => {
        it('fija position:relative si el elemento tiene position:static', () => {
            // getComputedStyle devuelve '' en happy-dom; simulamos 'static' como haría un navegador real
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'static' });
            loader.init();
            expect(element.style.position).toBe('relative');
            vi.restoreAllMocks();
        });

        it('no modifica el position si ya no es static', () => {
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'absolute' });
            element.style.position = 'absolute';
            loader.init();
            expect(element.style.position).toBe('absolute');
            vi.restoreAllMocks();
        });
    });
});
