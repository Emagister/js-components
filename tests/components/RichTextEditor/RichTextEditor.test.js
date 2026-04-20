import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocks hoisted para que estén disponibles antes de los imports
const { mockEditorInstance, mockChain, MockEditor } = vi.hoisted(() => {
    const mockChain = {
        focus: vi.fn().mockReturnThis(),
        toggleBold: vi.fn().mockReturnThis(),
        toggleItalic: vi.fn().mockReturnThis(),
        toggleStrike: vi.fn().mockReturnThis(),
        toggleHeading: vi.fn().mockReturnThis(),
        toggleBulletList: vi.fn().mockReturnThis(),
        toggleOrderedList: vi.fn().mockReturnThis(),
        toggleBlockquote: vi.fn().mockReturnThis(),
        toggleCodeBlock: vi.fn().mockReturnThis(),
        setLink: vi.fn().mockReturnThis(),
        unsetLink: vi.fn().mockReturnThis(),
        undo: vi.fn().mockReturnThis(),
        redo: vi.fn().mockReturnThis(),
        run: vi.fn(),
    };

    const mockEditorInstance = {
        getHTML: vi.fn(() => '<p></p>'),
        commands: {
            setContent: vi.fn(),
            focus: vi.fn(),
        },
        chain: vi.fn(() => mockChain),
        isActive: vi.fn(() => false),
        destroy: vi.fn(),
        _options: null,
    };

    // Debe ser function regular (no arrow) para poder usarse con `new`
    const MockEditor = vi.fn(function(options) {
        mockEditorInstance._options = options;
        if (options && options.element) {
            const div = document.createElement('div');
            div.className = 'ProseMirror';
            div.setAttribute('contenteditable', 'true');
            options.element.appendChild(div);
        }
        return mockEditorInstance;
    });

    return { mockEditorInstance, mockChain, MockEditor };
});

vi.mock('@tiptap/core', () => ({ Editor: MockEditor }));
vi.mock('@tiptap/starter-kit', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('../../../src/components/RichTextEditor/_rich-text-editor.scss', () => ({}));

import RichTextEditor from '../../../src/components/RichTextEditor/RichTextEditor.js';
import StarterKit from '@tiptap/starter-kit';

describe('RichTextEditor', () => {
    let element;
    let rte;

    beforeEach(() => {
        vi.clearAllMocks();
        // Restaurar comportamiento de mockReturnThis tras clearAllMocks
        mockChain.focus.mockReturnThis();
        mockChain.toggleBold.mockReturnThis();
        mockChain.toggleItalic.mockReturnThis();
        mockChain.toggleStrike.mockReturnThis();
        mockChain.toggleHeading.mockReturnThis();
        mockChain.toggleBulletList.mockReturnThis();
        mockChain.toggleOrderedList.mockReturnThis();
        mockChain.toggleBlockquote.mockReturnThis();
        mockChain.toggleCodeBlock.mockReturnThis();
        mockChain.setLink.mockReturnThis();
        mockChain.unsetLink.mockReturnThis();
        mockChain.undo.mockReturnThis();
        mockChain.redo.mockReturnThis();
        mockEditorInstance.chain.mockReturnValue(mockChain);
        mockEditorInstance.getHTML.mockReturnValue('<p></p>');

        element = document.createElement('div');
        document.body.appendChild(element);
        rte = new RichTextEditor(element);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('init()', () => {
        it('añade la clase rich-text-editor al elemento raíz', () => {
            rte.init();
            expect(element.classList.contains('rich-text-editor')).toBe(true);
        });

        it('crea el toolbar dentro del elemento raíz', () => {
            rte.init();
            expect(element.querySelector('.rte-toolbar')).not.toBeNull();
        });

        it('crea el contenedor del editor dentro del elemento raíz', () => {
            rte.init();
            expect(element.querySelector('.rte-editor')).not.toBeNull();
        });

        it('inicializa el Editor de TipTap', () => {
            rte.init();
            expect(MockEditor).toHaveBeenCalledOnce();
        });

        it('pasa el contenedor .rte-editor como elemento a TipTap', () => {
            rte.init();
            const editorEl = element.querySelector('.rte-editor');
            expect(MockEditor.mock.calls[0][0].element).toBe(editorEl);
        });

        it('expone la API pública en root.richTextEditor', () => {
            rte.init();
            expect(typeof element.richTextEditor.getHTML).toBe('function');
            expect(typeof element.richTextEditor.setHTML).toBe('function');
            expect(typeof element.richTextEditor.focus).toBe('function');
            expect(typeof element.richTextEditor.destroy).toBe('function');
        });

        it('despacha el evento emg-jsc:richTextEditor:initialized', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:richTextEditor:initialized', handler);
            rte.init();
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    describe('integración con textarea', () => {
        it('oculta el textarea cuando está presente', () => {
            const textarea = document.createElement('textarea');
            element.appendChild(textarea);
            rte = new RichTextEditor(element);
            rte.init();
            expect(textarea.style.display).toBe('none');
        });

        it('usa el valor del textarea como contenido inicial del editor', () => {
            const textarea = document.createElement('textarea');
            textarea.value = '<p>Contenido inicial</p>';
            element.appendChild(textarea);
            rte = new RichTextEditor(element);
            rte.init();
            expect(MockEditor.mock.calls[0][0].content).toBe('<p>Contenido inicial</p>');
        });

        it('sincroniza el contenido del editor con el textarea en cada actualización', () => {
            const textarea = document.createElement('textarea');
            element.appendChild(textarea);
            rte = new RichTextEditor(element);
            rte.init();

            mockEditorInstance.getHTML.mockReturnValue('<p>Nuevo contenido</p>');
            const { onUpdate } = MockEditor.mock.calls[0][0];
            onUpdate({ editor: mockEditorInstance });

            expect(textarea.value).toBe('<p>Nuevo contenido</p>');
        });

        it('funciona sin textarea en modo standalone', () => {
            expect(() => rte.init()).not.toThrow();
        });

        it('usa contenido vacío si no hay textarea', () => {
            rte.init();
            expect(MockEditor.mock.calls[0][0].content).toBe('');
        });
    });

    describe('API pública', () => {
        beforeEach(() => rte.init());

        it('getHTML() retorna el HTML del editor', () => {
            mockEditorInstance.getHTML.mockReturnValue('<p>Test</p>');
            expect(element.richTextEditor.getHTML()).toBe('<p>Test</p>');
        });

        it('setHTML() actualiza el contenido del editor', () => {
            element.richTextEditor.setHTML('<p>Nuevo</p>');
            expect(mockEditorInstance.commands.setContent).toHaveBeenCalledWith('<p>Nuevo</p>');
        });

        it('focus() enfoca el editor', () => {
            element.richTextEditor.focus();
            expect(mockEditorInstance.commands.focus).toHaveBeenCalled();
        });

        it('destroy() destruye la instancia del editor TipTap', () => {
            element.richTextEditor.destroy();
            expect(mockEditorInstance.destroy).toHaveBeenCalled();
        });

        it('destroy() elimina la propiedad richTextEditor del elemento', () => {
            element.richTextEditor.destroy();
            expect(element.richTextEditor).toBeUndefined();
        });

        it('destroy() restaura la visibilidad del textarea si estaba presente', () => {
            const el = document.createElement('div');
            const textarea = document.createElement('textarea');
            el.appendChild(textarea);
            document.body.appendChild(el);

            const instance = new RichTextEditor(el);
            instance.init();
            el.richTextEditor.destroy();

            expect(textarea.style.display).toBe('');
        });

        it('destroy() preserva el valor de display original del textarea', () => {
            const el = document.createElement('div');
            const textarea = document.createElement('textarea');
            textarea.style.display = 'flex';
            el.appendChild(textarea);
            document.body.appendChild(el);

            const instance = new RichTextEditor(el);
            instance.init();
            expect(textarea.style.display).toBe('none');

            el.richTextEditor.destroy();
            expect(textarea.style.display).toBe('flex');
        });
    });

    describe('toolbar', () => {
        beforeEach(() => rte.init());

        it('el toolbar contiene botones de formato con data-action', () => {
            const buttons = element.querySelectorAll('.rte-toolbar-btn[data-action]');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('los botones del toolbar tienen aria-label con el mismo texto que title', () => {
            const btn = element.querySelector('[data-action="toggleBold"]');
            expect(btn.getAttribute('aria-label')).toBe(btn.title);
            expect(btn.getAttribute('aria-label')).toBe('Negrita');
        });

        it('existe un botón para toggleBold', () => {
            expect(element.querySelector('[data-action="toggleBold"]')).not.toBeNull();
        });

        it('existe un botón para toggleItalic', () => {
            expect(element.querySelector('[data-action="toggleItalic"]')).not.toBeNull();
        });

        it('existe un botón para undo', () => {
            expect(element.querySelector('[data-action="undo"]')).not.toBeNull();
        });

        it('existe un botón para redo', () => {
            expect(element.querySelector('[data-action="redo"]')).not.toBeNull();
        });

        it('al hacer clic en Bold ejecuta toggleBold en el editor', () => {
            const boldBtn = element.querySelector('[data-action="toggleBold"]');
            boldBtn.click();
            expect(mockChain.toggleBold).toHaveBeenCalled();
            expect(mockChain.run).toHaveBeenCalled();
        });

        it('al hacer clic en Italic ejecuta toggleItalic en el editor', () => {
            const italicBtn = element.querySelector('[data-action="toggleItalic"]');
            italicBtn.click();
            expect(mockChain.toggleItalic).toHaveBeenCalled();
            expect(mockChain.run).toHaveBeenCalled();
        });

        it('al hacer clic en H2 ejecuta toggleHeading con level 2', () => {
            const h2Btn = element.querySelector('[data-action="toggleHeading"][data-args]');
            const args = JSON.parse(h2Btn.dataset.args);
            expect(args.level).toBe(2);
            h2Btn.click();
            expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
            expect(mockChain.run).toHaveBeenCalled();
        });

        it('el toolbar previene la pérdida de foco con mousedown', () => {
            const toolbar = element.querySelector('.rte-toolbar');
            const event = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
            toolbar.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        });

        it('añade la clase is-active en los botones cuando el formato está activo', () => {
            mockEditorInstance.isActive.mockImplementation((type) => type === 'bold');
            const { onUpdate } = MockEditor.mock.calls[0][0];
            onUpdate({ editor: mockEditorInstance });

            const boldBtn = element.querySelector('[data-action="toggleBold"]');
            const italicBtn = element.querySelector('[data-action="toggleItalic"]');
            expect(boldBtn.classList.contains('is-active')).toBe(true);
            expect(italicBtn.classList.contains('is-active')).toBe(false);
        });
    });

    describe('enlace (toggleLink)', () => {
        const originalPrompt = window.prompt;

        beforeEach(() => {
            // happy-dom no define window.prompt, lo creamos como mock
            window.prompt = vi.fn(() => null);
            rte.init();
        });

        afterEach(() => {
            window.prompt = originalPrompt;
        });

        it('existe un botón para toggleLink en el toolbar', () => {
            expect(element.querySelector('[data-action="toggleLink"]')).not.toBeNull();
        });

        it('al hacer clic sin enlace activo muestra prompt y aplica setLink', () => {
            window.prompt.mockReturnValue('https://example.com');
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(window.prompt).toHaveBeenCalled();
            expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' });
            expect(mockChain.run).toHaveBeenCalled();
        });

        it('al hacer clic con enlace activo elimina el enlace sin mostrar prompt', () => {
            mockEditorInstance.isActive.mockImplementation((type) => type === 'link');

            element.querySelector('[data-action="toggleLink"]').click();

            expect(window.prompt).not.toHaveBeenCalled();
            expect(mockChain.unsetLink).toHaveBeenCalled();
            expect(mockChain.run).toHaveBeenCalled();
        });

        it('no aplica el enlace si el usuario cancela el prompt', () => {
            window.prompt.mockReturnValue(null);
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(mockChain.setLink).not.toHaveBeenCalled();
            expect(mockChain.run).not.toHaveBeenCalled();
        });

        it('no aplica el enlace si el usuario introduce una URL vacía', () => {
            window.prompt.mockReturnValue('   ');
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(mockChain.setLink).not.toHaveBeenCalled();
        });

        it('no aplica el enlace si la URL usa el protocolo javascript:', () => {
            window.prompt.mockReturnValue('javascript:alert(1)');
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(mockChain.setLink).not.toHaveBeenCalled();
        });

        it('no aplica el enlace si la URL usa el protocolo data:', () => {
            window.prompt.mockReturnValue('data:text/html,<script>alert(1)</script>');
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(mockChain.setLink).not.toHaveBeenCalled();
        });

        it('aplica el enlace con URL mailto:', () => {
            window.prompt.mockReturnValue('mailto:test@example.com');
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'mailto:test@example.com' });
        });

        it('aplica el enlace con URL relativa', () => {
            window.prompt.mockReturnValue('/ruta/relativa');
            mockEditorInstance.isActive.mockReturnValue(false);

            element.querySelector('[data-action="toggleLink"]').click();

            expect(mockChain.setLink).toHaveBeenCalledWith({ href: '/ruta/relativa' });
        });

        it('el label por defecto del botón de enlace es "Enlace"', () => {
            expect(element.querySelector('[data-action="toggleLink"]').title).toBe('Enlace');
        });

        it('el texto del prompt se puede personalizar con labels.linkPrompt', () => {
            window.prompt.mockReturnValue('https://x.com');
            mockEditorInstance.isActive.mockReturnValue(false);

            const el = document.createElement('div');
            document.body.appendChild(el);
            el.dataset.settings = JSON.stringify({ labels: { linkPrompt: 'Enter URL:' } });
            const instance = new RichTextEditor(el);
            instance.init();

            el.querySelector('[data-action="toggleLink"]').click();

            expect(window.prompt).toHaveBeenCalledWith('Enter URL:');
        });

        it('el botón toggleLink aparece en el toolbar filtrado cuando se incluye en settings.toolbar', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            el.dataset.settings = JSON.stringify({ toolbar: ['toggleBold', 'toggleLink'] });
            const instance = new RichTextEditor(el);
            instance.init();

            const actions = Array.from(el.querySelectorAll('.rte-toolbar-btn[data-action]')).map(b => b.dataset.action);
            expect(actions).toContain('toggleLink');
        });
    });

    describe('configuración de la extensión Link (settings.link)', () => {
        it('configura StarterKit con link.openOnClick: false por defecto', () => {
            rte.init();
            expect(StarterKit.configure).toHaveBeenCalledWith(
                expect.objectContaining({ link: expect.objectContaining({ openOnClick: false }) })
            );
        });

        it('configura StarterKit con link.HTMLAttributes vacío por defecto', () => {
            rte.init();
            expect(StarterKit.configure).toHaveBeenCalledWith(
                expect.objectContaining({ link: expect.objectContaining({ HTMLAttributes: {} }) })
            );
        });

        it('permite sobreescribir openOnClick desde settings.link', () => {
            element.dataset.settings = JSON.stringify({ link: { openOnClick: true } });
            rte = new RichTextEditor(element);
            rte.init();

            expect(StarterKit.configure).toHaveBeenCalledWith(
                expect.objectContaining({ link: expect.objectContaining({ openOnClick: true }) })
            );
        });

        it('pasa htmlAttributes de settings.link como HTMLAttributes a StarterKit link', () => {
            element.dataset.settings = JSON.stringify({
                link: { htmlAttributes: { target: null, rel: 'noopener noreferrer' } }
            });
            rte = new RichTextEditor(element);
            rte.init();

            expect(StarterKit.configure).toHaveBeenCalledWith(
                expect.objectContaining({
                    link: expect.objectContaining({
                        HTMLAttributes: { target: null, rel: 'noopener noreferrer' }
                    })
                })
            );
        });

        it('permite configurar solo htmlAttributes sin afectar openOnClick por defecto', () => {
            element.dataset.settings = JSON.stringify({
                link: { htmlAttributes: { target: '_blank' } }
            });
            rte = new RichTextEditor(element);
            rte.init();

            expect(StarterKit.configure).toHaveBeenCalledWith(
                expect.objectContaining({
                    link: expect.objectContaining({ openOnClick: false, HTMLAttributes: { target: '_blank' } })
                })
            );
        });

        it('permite configurar openOnClick y htmlAttributes juntos', () => {
            element.dataset.settings = JSON.stringify({
                link: { openOnClick: true, htmlAttributes: { rel: 'nofollow' } }
            });
            rte = new RichTextEditor(element);
            rte.init();

            expect(StarterKit.configure).toHaveBeenCalledWith(
                expect.objectContaining({
                    link: expect.objectContaining({ openOnClick: true, HTMLAttributes: { rel: 'nofollow' } })
                })
            );
        });
    });

    describe('settings', () => {
        describe('toolbar personalizada', () => {
            it('muestra solo los botones indicados en settings.toolbar', () => {
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleBold', 'toggleItalic'] });
                rte = new RichTextEditor(element);
                rte.init();

                const buttons = element.querySelectorAll('.rte-toolbar-btn[data-action]');
                const actions = Array.from(buttons).map(b => b.dataset.action);
                expect(actions).toEqual(['toggleBold', 'toggleItalic']);
            });

            it('no renderiza ningún botón si toolbar es un array vacío', () => {
                element.dataset.settings = JSON.stringify({ toolbar: [] });
                rte = new RichTextEditor(element);
                rte.init();

                const buttons = element.querySelectorAll('.rte-toolbar-btn[data-action]');
                expect(buttons.length).toBe(0);
            });

            it('muestra todos los botones si toolbar no se especifica', () => {
                rte.init();
                const buttons = element.querySelectorAll('.rte-toolbar-btn[data-action]');
                expect(buttons.length).toBeGreaterThan(5);
            });

            it('no muestra separadores al inicio de la toolbar filtrada', () => {
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleBold'] });
                rte = new RichTextEditor(element);
                rte.init();

                const toolbar = element.querySelector('.rte-toolbar');
                expect(toolbar.firstElementChild.classList.contains('rte-toolbar-sep')).toBe(false);
            });

            it('no muestra separadores al final de la toolbar filtrada', () => {
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleBold'] });
                rte = new RichTextEditor(element);
                rte.init();

                const toolbar = element.querySelector('.rte-toolbar');
                expect(toolbar.lastElementChild.classList.contains('rte-toolbar-sep')).toBe(false);
            });

            it('no muestra separadores consecutivos en la toolbar filtrada', () => {
                // Bold está en el primer grupo, undo en el último: quedarían separadores consecutivos si no se limpian
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleBold', 'undo'] });
                rte = new RichTextEditor(element);
                rte.init();

                const children = Array.from(element.querySelector('.rte-toolbar').children);
                for (let i = 0; i < children.length - 1; i++) {
                    const bothSeps = children[i].classList.contains('rte-toolbar-sep') &&
                                     children[i + 1].classList.contains('rte-toolbar-sep');
                    expect(bothSeps, 'No debe haber dos separadores consecutivos').toBe(false);
                }
            });

            it('incluye separadores entre grupos de botones visibles', () => {
                // Bold (grupo 1) y undo (grupo 5) deben tener al menos un separador entre ellos
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleBold', 'undo'] });
                rte = new RichTextEditor(element);
                rte.init();

                const hasSeparator = element.querySelector('.rte-toolbar .rte-toolbar-sep') !== null;
                expect(hasSeparator).toBe(true);
            });

            it('muestra solo H2 cuando settings.toolbar incluye toggleHeadingH2', () => {
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleHeadingH2'] });
                rte = new RichTextEditor(element);
                rte.init();

                const btns = element.querySelectorAll('.rte-toolbar-btn[data-action]');
                expect(btns.length).toBe(1);
                expect(JSON.parse(btns[0].dataset.args).level).toBe(2);
            });

            it('muestra solo H3 cuando settings.toolbar incluye toggleHeadingH3', () => {
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleHeadingH3'] });
                rte = new RichTextEditor(element);
                rte.init();

                const btns = element.querySelectorAll('.rte-toolbar-btn[data-action]');
                expect(btns.length).toBe(1);
                expect(JSON.parse(btns[0].dataset.args).level).toBe(3);
            });

            it('puede incluir H2 y H3 de forma independiente en settings.toolbar', () => {
                element.dataset.settings = JSON.stringify({ toolbar: ['toggleHeadingH2', 'toggleHeadingH3'] });
                rte = new RichTextEditor(element);
                rte.init();

                const btns = element.querySelectorAll('.rte-toolbar-btn[data-action]');
                expect(btns.length).toBe(2);
                expect(JSON.parse(btns[0].dataset.args).level).toBe(2);
                expect(JSON.parse(btns[1].dataset.args).level).toBe(3);
            });
        });

        describe('labels personalizados', () => {
            it('usa el title por defecto en español para cada botón', () => {
                rte.init();
                const boldBtn = element.querySelector('[data-action="toggleBold"]');
                expect(boldBtn.title).toBe('Negrita');
            });

            it('sobreescribe el title del botón con el label personalizado', () => {
                element.dataset.settings = JSON.stringify({ labels: { toggleBold: 'Bold' } });
                rte = new RichTextEditor(element);
                rte.init();

                const boldBtn = element.querySelector('[data-action="toggleBold"]');
                expect(boldBtn.title).toBe('Bold');
            });

            it('solo sobreescribe los labels indicados, dejando el resto por defecto', () => {
                element.dataset.settings = JSON.stringify({ labels: { toggleBold: 'Bold' } });
                rte = new RichTextEditor(element);
                rte.init();

                const italicBtn = element.querySelector('[data-action="toggleItalic"]');
                expect(italicBtn.title).toBe('Cursiva');
            });

            it('permite personalizar el label de toggleHeadingH2', () => {
                element.dataset.settings = JSON.stringify({ labels: { toggleHeadingH2: 'Heading 2' } });
                rte = new RichTextEditor(element);
                rte.init();

                const h2Btn = element.querySelector('[data-action="toggleHeading"][data-args=\'{"level":2}\']');
                expect(h2Btn.title).toBe('Heading 2');
            });

            it('permite personalizar el label de toggleHeadingH3 independientemente de H2', () => {
                element.dataset.settings = JSON.stringify({
                    labels: { toggleHeadingH2: 'H2', toggleHeadingH3: 'H3' }
                });
                rte = new RichTextEditor(element);
                rte.init();

                const h2Btn = element.querySelector('[data-action="toggleHeading"][data-args=\'{"level":2}\']');
                const h3Btn = element.querySelector('[data-action="toggleHeading"][data-args=\'{"level":3}\']');
                expect(h2Btn.title).toBe('H2');
                expect(h3Btn.title).toBe('H3');
            });

            it('permite personalizar undo y redo', () => {
                element.dataset.settings = JSON.stringify({ labels: { undo: 'Undo', redo: 'Redo' } });
                rte = new RichTextEditor(element);
                rte.init();

                expect(element.querySelector('[data-action="undo"]').title).toBe('Undo');
                expect(element.querySelector('[data-action="redo"]').title).toBe('Redo');
            });
        });
    });
});
