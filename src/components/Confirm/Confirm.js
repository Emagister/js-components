import Component from '../Component';
import Modal from '../Modal/Modal';

export default class Confirm extends Component {
    constructor(element) {
        super(element);
        this.titleEl = this.root.querySelector('[data-confirm-title]');
        this.messageEl = this.root.querySelector('[data-confirm-message]');
        this.confirmBtn = this.root.querySelector('[data-confirm-btn]');
        this.cancelBtn = this.root.querySelector('[data-cancel-btn]');

        this.resolve = null;
    }

    init() {
        // Initialize Modal on this root element
        new Modal(this.root);

        this.confirmBtn.addEventListener('click', () => {
            this.root.modal.hide();
            if (this.resolve) {
                this.resolve(true);
                this.resolve = null;
            }
        });

        this.cancelBtn.addEventListener('click', () => {
            this.root.modal.hide();
            if (this.resolve) {
                this.resolve(false);
                this.resolve = null;
            }
        });

        // Global access
        window.confirmCustom = (message, title = 'Confirmar') => {
            return this.ask(message, title);
        };

        this.root.dispatchEvent(new CustomEvent('confirm:initialized'));
    }

    ask(message, title) {
        if (this.titleEl && title) {
            this.titleEl.textContent = title;
        }
        if (this.messageEl && message) {
            this.messageEl.textContent = message;
        }

        this.root.modal.show();

        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    destroy() {
        delete window.confirmCustom;
    }
}
