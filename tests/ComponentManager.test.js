import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ComponentManager from '../src/ComponentManager.js';

// Mock del registry para controlar las cargas dinámicas
// Se mockean ambos especificadores (con y sin .js) para cubrir el import de ComponentManager.
// vi.hoisted() garantiza que registryMock esté disponible cuando vi.mock() se hoisea al inicio.
const registryMock = vi.hoisted(() => ({
    'loader': vi.fn(),
    'modal': vi.fn(),
}));

vi.mock('../src/ComponentRegistry.js', () => ({
    default: registryMock,
}));

vi.mock('../src/ComponentRegistry', () => ({
    default: registryMock,
}));

function createMockComponentClass() {
    const initFn = vi.fn();
    // Debe ser función regular (no arrow) para poder usarse con `new`
    const ComponentClass = vi.fn(function () {
        this.init = initFn;
    });
    ComponentClass._initFn = initFn;
    return ComponentClass;
}

// Rastrear los MutationObservers creados para desconectarlos entre tests
let activeObservers = [];
const OriginalMutationObserver = global.MutationObserver;

describe('ComponentManager', () => {
    let manager;

    beforeEach(async () => {
        // Reemplazar MutationObserver para poder desconectarlo en afterEach
        activeObservers = [];
        global.MutationObserver = class TrackedMO extends OriginalMutationObserver {
            constructor(cb) {
                super(cb);
                activeObservers.push(this);
            }
        };

        document.body.innerHTML = '';

        const { default: registry } = await import('../src/ComponentRegistry.js');
        registry['loader'].mockReset();
        registry['modal'].mockReset();

        manager = new ComponentManager();
    });

    afterEach(() => {
        // Desconectar todos los observers activos para evitar contaminación entre tests
        activeObservers.forEach(obs => obs.disconnect());
        activeObservers = [];
        global.MutationObserver = OriginalMutationObserver;
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('crea un WeakMap para las instancias', () => {
            expect(manager.instances).toBeInstanceOf(WeakMap);
        });

        it('asigna el registry', () => {
            expect(manager.registry).toBeDefined();
            expect(manager.registry['loader']).toBeDefined();
        });
    });

    describe('start()', () => {
        it('llama a init() si el DOM ya está cargado', () => {
            const initSpy = vi.spyOn(manager, 'init').mockImplementation(() => {});
            // En happy-dom readyState es 'complete'
            manager.start();
            expect(initSpy).toHaveBeenCalledOnce();
        });

        it('espera al evento DOMContentLoaded si el DOM aún está cargando', () => {
            const initSpy = vi.spyOn(manager, 'init').mockImplementation(() => {});
            Object.defineProperty(document, 'readyState', {
                configurable: true,
                get: () => 'loading',
            });

            manager.start();
            expect(initSpy).not.toHaveBeenCalled();

            document.dispatchEvent(new Event('DOMContentLoaded'));
            expect(initSpy).toHaveBeenCalledOnce();

            Object.defineProperty(document, 'readyState', {
                configurable: true,
                get: () => 'complete',
            });
        });
    });

    describe('init()', () => {
        it('emite el evento app:initialized en window', () => {
            const handler = vi.fn();
            window.addEventListener('app:initialized', handler);
            manager.init();
            window.removeEventListener('app:initialized', handler);
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    describe('montaje de componentes', () => {
        it('instancia el componente encontrado en el DOM', async () => {
            const MockClass = createMockComponentClass();
            const { default: registry } = await import('../src/ComponentRegistry.js');
            registry['loader'].mockResolvedValue({ default: MockClass });

            document.body.innerHTML = '<div data-component="loader"></div>';
            manager.init();

            await vi.waitFor(() => {
                expect(MockClass).toHaveBeenCalledOnce();
                expect(MockClass._initFn).toHaveBeenCalledOnce();
            });
        });

        it('no monta el mismo componente dos veces en el mismo elemento', async () => {
            const MockClass = createMockComponentClass();
            const { default: registry } = await import('../src/ComponentRegistry.js');
            registry['loader'].mockResolvedValue({ default: MockClass });

            document.body.innerHTML = '<div data-component="loader"></div>';
            manager.init();
            manager.init();

            await vi.waitFor(() => {
                expect(MockClass).toHaveBeenCalledTimes(1);
            });
        });

        it('monta múltiples componentes en el mismo elemento', async () => {
            const MockLoader = createMockComponentClass();
            const MockModal = createMockComponentClass();
            const { default: registry } = await import('../src/ComponentRegistry.js');
            registry['loader'].mockResolvedValue({ default: MockLoader });
            registry['modal'].mockResolvedValue({ default: MockModal });

            document.body.innerHTML = '<div data-component="loader modal"></div>';
            manager.init();

            await vi.waitFor(() => {
                expect(MockLoader).toHaveBeenCalledOnce();
                expect(MockModal).toHaveBeenCalledOnce();
            });
        });

        it('no lanza error si el componente no existe en el registry', () => {
            document.body.innerHTML = '<div data-component="componente-inexistente"></div>';
            expect(() => manager.init()).not.toThrow();
        });
    });

    describe('evento component:scan', () => {
        it('monta componentes al recibir component:scan en un subelemento', async () => {
            const MockClass = createMockComponentClass();
            const { default: registry } = await import('../src/ComponentRegistry.js');
            registry['loader'].mockResolvedValue({ default: MockClass });

            manager.init();

            const container = document.createElement('div');
            const child = document.createElement('div');
            child.dataset.component = 'loader';
            container.appendChild(child);
            document.body.appendChild(container);

            container.dispatchEvent(new CustomEvent('component:scan', { bubbles: false }));

            await vi.waitFor(() => {
                expect(MockClass).toHaveBeenCalledOnce();
            });
        });
    });
});
