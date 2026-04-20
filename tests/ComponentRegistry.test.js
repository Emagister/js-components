import { describe, it, expect } from 'vitest';
import ComponentRegistry from '../src/ComponentRegistry.js';

const EXPECTED_COMPONENTS = [
    'async-form',
    'message-toast',
    'loader',
    'dropdown',
    'data-table',
    'tooltip',
    'datepicker',
    'modal',
    'confirm',
    'rich-text-editor',
];

describe('ComponentRegistry', () => {
    it('contiene exactamente los componentes esperados', () => {
        expect(Object.keys(ComponentRegistry)).toEqual(expect.arrayContaining(EXPECTED_COMPONENTS));
        expect(Object.keys(ComponentRegistry)).toHaveLength(EXPECTED_COMPONENTS.length);
    });

    it('todos los valores son funciones (lazy loaders)', () => {
        Object.entries(ComponentRegistry).forEach(([name, loader]) => {
            expect(typeof loader, `"${name}" debe ser una función`).toBe('function');
        });
    });

    it('cada loader devuelve una Promise', () => {
        Object.entries(ComponentRegistry).forEach(([name, loader]) => {
            const result = loader();
            expect(result, `"${name}" debe devolver una Promise`).toBeInstanceOf(Promise);
            // Evitar unhandled rejection
            result.catch(() => {});
        });
    });
});
