import { describe, it, expect } from 'vitest';
import CheckboxNormalizer from '../../../../src/components/AsyncForm/Normalizers/CheckboxNormalizer.js';

function createForm(checkboxes = []) {
    const form = document.createElement('form');
    checkboxes.forEach(({ name, checked }) => {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        if (name) cb.name = name;
        cb.checked = checked;
        form.appendChild(cb);
    });
    return form;
}

describe('CheckboxNormalizer', () => {
    it('asigna "true" a un checkbox marcado', () => {
        const form = createForm([{ name: 'activo', checked: true }]);
        const formData = new FormData();
        CheckboxNormalizer(form, formData);
        expect(formData.get('activo')).toBe('true');
    });

    it('asigna "false" a un checkbox desmarcado', () => {
        const form = createForm([{ name: 'activo', checked: false }]);
        const formData = new FormData();
        CheckboxNormalizer(form, formData);
        expect(formData.get('activo')).toBe('false');
    });

    it('procesa múltiples checkboxes en un mismo formulario', () => {
        const form = createForm([
            { name: 'acepta_terminos', checked: true },
            { name: 'suscripcion', checked: false },
            { name: 'notificaciones', checked: true },
        ]);
        const formData = new FormData();
        CheckboxNormalizer(form, formData);
        expect(formData.get('acepta_terminos')).toBe('true');
        expect(formData.get('suscripcion')).toBe('false');
        expect(formData.get('notificaciones')).toBe('true');
    });

    it('ignora checkboxes sin atributo name', () => {
        const form = createForm([{ name: null, checked: true }]);
        const formData = new FormData();
        CheckboxNormalizer(form, formData);
        expect([...formData.entries()]).toHaveLength(0);
    });

    it('no modifica el FormData si no hay checkboxes', () => {
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'nombre';
        form.appendChild(input);

        const formData = new FormData();
        formData.set('nombre', 'Juan');
        CheckboxNormalizer(form, formData);

        expect(formData.get('nombre')).toBe('Juan');
        expect([...formData.entries()]).toHaveLength(1);
    });

    it('sobreescribe el valor previo del FormData para el campo checkbox', () => {
        const form = createForm([{ name: 'activo', checked: false }]);
        const formData = new FormData();
        formData.set('activo', 'on'); // valor previo por defecto de un checkbox marcado
        CheckboxNormalizer(form, formData);
        expect(formData.get('activo')).toBe('false');
    });
});
