import { describe, it, expect } from 'vitest';
import Component from '../../src/components/Component.js';

class ConcreteComponent extends Component {
    init() {}
}

class NoInitComponent extends Component {}

describe('Component', () => {
    describe('constructor', () => {
        it('lanza TypeError al instanciar la clase abstracta directamente', () => {
            const el = document.createElement('div');
            expect(() => new Component(el)).toThrow(TypeError);
            expect(() => new Component(el)).toThrow('abstract class');
        });

        it('lanza Error si no se proporciona elemento raíz', () => {
            expect(() => new ConcreteComponent(null)).toThrow('No root element provided');
            expect(() => new ConcreteComponent(undefined)).toThrow('No root element provided');
        });

        it('asigna this.root al elemento proporcionado', () => {
            const el = document.createElement('div');
            const component = new ConcreteComponent(el);
            expect(component.root).toBe(el);
        });

        it('incluye el nombre de la clase en el mensaje de error de elemento faltante', () => {
            expect(() => new ConcreteComponent(null)).toThrow('ConcreteComponent');
        });
    });

    describe('init()', () => {
        it('lanza Error si la subclase no implementa init()', () => {
            const el = document.createElement('div');
            const component = new NoInitComponent(el);
            expect(() => component.init()).toThrow('must implement the init() method');
            expect(() => component.init()).toThrow('NoInitComponent');
        });

        it('no lanza error si la subclase implementa init()', () => {
            const el = document.createElement('div');
            const component = new ConcreteComponent(el);
            expect(() => component.init()).not.toThrow();
        });
    });
});
