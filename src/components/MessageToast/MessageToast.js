import Component from "../Component";
import { MessageToastType } from './MessageToastType';
import { Toast } from 'bootstrap';

export default class MessageToast extends Component {
    constructor(element) {
        super(element);
        this.messageEl = this.root.querySelector('[data-toast-message]');
        this.timeoutId = null;

        const settings = JSON.parse(this.root.dataset.settings || '{}');
        this.settings = {
            mode: settings.mode || this.root.dataset.mode || 'global',
            duration: settings.duration || parseInt(this.root.dataset.duration || '3000')
        };

        this.handleShow = this.#handleGlobalShow.bind(this);
    }

    init() {
        import('./_message-toast.scss');

        this.root.messageToast = {
            show: (message, type, duration) => this.show(message, type, duration || this.settings.duration),
            hide: () => this.hide(),
            destroy: () => this.#destroy()
        };

        this.toast = new Toast(this.root, {
            autohide: false
        });

        if (this.settings.mode === 'global') {
            this.#bindEvents();
        }

        this.root.dispatchEvent(new CustomEvent('messageToast:initialized'));
    }

    #bindEvents() {
        window.addEventListener('toast:show', this.handleShow);
    }

    #handleGlobalShow(e) {
        const { message, type = MessageToastType.SUCCESS, duration = 3000 } = e.detail;
        this.show(message, type, duration);
    }

    #destroy() {
        this.#clearTimeout();
        if (this.toast) {
            this.toast.dispose();
        }
        window.removeEventListener('toast:show', this.handleShow);
        delete this.root.messageToast;
    }

    #clearTimeout() {
        if (!this.timeoutId) {
            return;
        }

        clearTimeout(this.timeoutId);
        this.timeoutId = null;
    }

    show(message, type = MessageToastType.SUCCESS, duration = 3000) {
        if (this.messageEl) {
            this.messageEl.textContent = message;
        }

        this.root.classList.remove(...Object.values(MessageToastType).map(type => `is-${type}`));
        this.root.classList.add(`is-${type}`);

        this.#clearTimeout();

        this.toast.show();

        if (duration !== -1 && duration > 0) {
            this.timeoutId = setTimeout(() => this.hide(), duration);
        }
    }

    hide() {
        this.#clearTimeout();
        this.toast.hide();
    }
}
