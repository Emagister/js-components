import Component from "../Component";
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import "./_rich-text-editor.scss";

const DEFAULT_LABELS = {
    toggleBold: 'Negrita',
    toggleItalic: 'Cursiva',
    toggleStrike: 'Tachado',
    toggleHeadingH2: 'Título 2',
    toggleHeadingH3: 'Título 3',
    toggleBulletList: 'Lista',
    toggleOrderedList: 'Lista ordenada',
    toggleBlockquote: 'Cita',
    toggleCodeBlock: 'Bloque de código',
    toggleLink: 'Enlace',
    linkPrompt: 'Introduce la URL:',
    undo: 'Deshacer',
    redo: 'Rehacer',
};

const TOOLBAR_ITEMS = [
    { action: 'toggleBold', labelKey: 'toggleBold', icon: 'bi-type-bold', activeCheck: ['bold'] },
    { action: 'toggleItalic', labelKey: 'toggleItalic', icon: 'bi-type-italic', activeCheck: ['italic'] },
    { action: 'toggleStrike', labelKey: 'toggleStrike', icon: 'bi-type-strikethrough', activeCheck: ['strike'] },
    { type: 'separator' },
    { action: 'toggleHeading', args: { level: 2 }, labelKey: 'toggleHeadingH2', icon: 'bi-type-h2', activeCheck: ['heading', { level: 2 }] },
    { action: 'toggleHeading', args: { level: 3 }, labelKey: 'toggleHeadingH3', icon: 'bi-type-h3', activeCheck: ['heading', { level: 3 }] },
    { type: 'separator' },
    { action: 'toggleBulletList', labelKey: 'toggleBulletList', icon: 'bi-list-ul', activeCheck: ['bulletList'] },
    { action: 'toggleOrderedList', labelKey: 'toggleOrderedList', icon: 'bi-list-ol', activeCheck: ['orderedList'] },
    { type: 'separator' },
    { action: 'toggleBlockquote', labelKey: 'toggleBlockquote', icon: 'bi-quote', activeCheck: ['blockquote'] },
    { action: 'toggleCodeBlock', labelKey: 'toggleCodeBlock', icon: 'bi-code-square', activeCheck: ['codeBlock'] },
    { action: 'toggleLink', labelKey: 'toggleLink', icon: 'bi-link-45deg', activeCheck: ['link'] },
    { type: 'separator' },
    { action: 'undo', labelKey: 'undo', icon: 'bi-arrow-counterclockwise' },
    { action: 'redo', labelKey: 'redo', icon: 'bi-arrow-clockwise' },
];

export default class RichTextEditor extends Component {
    constructor(element) {
        super(element);
        this.editor = null;
        this.textarea = null;
        this.toolbarEl = null;
        this.editorEl = null;
        this._onToolbarClick = (e) => this.#handleToolbarClick(e);
        this._onToolbarMousedown = (e) => e.preventDefault();

        const settings = JSON.parse(this.root.dataset.settings || '{}');
        const linkSettings = settings.link ?? {};
        this.settings = {
            toolbar: settings.toolbar ?? null,
            labels: { ...DEFAULT_LABELS, ...settings.labels },
            link: {
                openOnClick: false,
                htmlAttributes: {},
                ...linkSettings,
            },
        };
    }

    init() {
        this.textarea = this.root.querySelector('textarea');
        const initialContent = this.textarea?.value || '';

        if (this.textarea) {
            this._textareaOriginalDisplay = this.textarea.style.display;
            this.textarea.style.display = 'none';
        }

        this.toolbarEl = this.#createToolbar();
        this.editorEl = document.createElement('div');
        this.editorEl.className = 'rte-editor';

        this.root.classList.add('rich-text-editor');
        this.root.appendChild(this.toolbarEl);
        this.root.appendChild(this.editorEl);

        this.editor = new Editor({
            element: this.editorEl,
            extensions: [StarterKit.configure({
                link: {
                    openOnClick: this.settings.link.openOnClick,
                    HTMLAttributes: this.settings.link.htmlAttributes,
                },
            })],
            content: initialContent,
            onUpdate: ({ editor }) => {
                if (this.textarea) {
                    this.textarea.value = editor.getHTML();
                }
                this.#updateToolbarState();
            },
            onSelectionUpdate: () => {
                this.#updateToolbarState();
            },
        });

        this.root.richTextEditor = {
            getHTML: () => this.editor.getHTML(),
            setHTML: (html) => this.editor.commands.setContent(html),
            focus: () => this.editor.commands.focus(),
            destroy: () => this.#destroy(),
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:richTextEditor:initialized'));
    }

    #getVisibleItems() {
        if (!this.settings.toolbar) return TOOLBAR_ITEMS;

        const allowed = new Set(this.settings.toolbar);
        const result = [];

        for (const item of TOOLBAR_ITEMS) {
            if (item.type === 'separator') {
                // Añade el separador solo si el último item añadido fue un botón
                if (result.length > 0 && result[result.length - 1].type !== 'separator') {
                    result.push(item);
                }
            } else if (allowed.has(item.labelKey)) {
                result.push(item);
            }
        }

        // Elimina separador final si no hay botón después
        if (result.at(-1)?.type === 'separator') result.pop();

        return result;
    }

    #createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'rte-toolbar';
        toolbar.addEventListener('click', this._onToolbarClick);
        toolbar.addEventListener('mousedown', this._onToolbarMousedown);

        this.#getVisibleItems().forEach((item) => {
            if (item.type === 'separator') {
                const sep = document.createElement('span');
                sep.className = 'rte-toolbar-sep';
                toolbar.appendChild(sep);
                return;
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rte-toolbar-btn';
            const label = this.settings.labels[item.labelKey] ?? '';
            btn.title = label;
            btn.setAttribute('aria-label', label);
            btn.dataset.action = item.action;

            if (item.args) {
                btn.dataset.args = JSON.stringify(item.args);
            }

            const icon = document.createElement('i');
            icon.className = `bi ${item.icon}`;
            btn.appendChild(icon);
            toolbar.appendChild(btn);
        });

        return toolbar;
    }

    #handleToolbarClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn || !this.editor) return;

        const action = btn.dataset.action;

        if (action === 'toggleLink') {
            this.#handleToggleLink();
            return;
        }

        const args = btn.dataset.args ? JSON.parse(btn.dataset.args) : undefined;
        let chain = this.editor.chain().focus();
        chain = args ? chain[action](args) : chain[action]();
        chain.run();
    }

    #handleToggleLink() {
        if (this.editor.isActive('link')) {
            this.editor.chain().focus().unsetLink().run();
            return;
        }

        const url = window.prompt(this.settings.labels.linkPrompt);
        if (!url || !url.trim()) return;

        const trimmed = url.trim();
        if (!/^(https?:\/\/|mailto:|tel:|\/|\.\.?\/|#)/i.test(trimmed)) return;

        this.editor.chain().focus().setLink({ href: trimmed }).run();
    }

    #updateToolbarState() {
        if (!this.toolbarEl || !this.editor) return;

        TOOLBAR_ITEMS.forEach((item) => {
            if (!item.activeCheck || !item.action) return;

            const argsStr = item.args ? JSON.stringify(item.args) : undefined;
            const selector = argsStr
                ? `[data-action="${item.action}"][data-args='${argsStr}']`
                : `[data-action="${item.action}"]`;

            const btn = this.toolbarEl.querySelector(selector);
            if (btn) {
                const isActive = this.editor.isActive(...item.activeCheck);
                btn.classList.toggle('is-active', isActive);
            }
        });
    }

    #destroy() {
        if (this.toolbarEl) {
            this.toolbarEl.removeEventListener('click', this._onToolbarClick);
            this.toolbarEl.removeEventListener('mousedown', this._onToolbarMousedown);
        }

        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }

        if (this.textarea) {
            this.textarea.style.display = this._textareaOriginalDisplay ?? '';
        }

        delete this.root.richTextEditor;
    }
}
