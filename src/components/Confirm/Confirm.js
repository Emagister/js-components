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

        this._onConfirmClick = () => {
            this.root.modal.hide();
            if (this.resolve) {
                this.resolve(true);
                this.resolve = null;
            }
        };

        this._onCancelClick = () => {
            this.root.modal.hide();
            if (this.resolve) {
                this.resolve(false);
                this.resolve = null;
            }
        };

        this.confirmBtn.addEventListener('click', this._onConfirmClick);
        this.cancelBtn.addEventListener('click', this._onCancelClick);

        // Global access
        window.confirmCustom = (message, title = 'Confirmar') => {
            return this.ask(message, title);
        };

        this.root.confirm = {
            destroy: () => this.#destroy()
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

    #destroy() {
        this.confirmBtn.removeEventListener('click', this._onConfirmClick);
        this.cancelBtn.removeEventListener('click', this._onCancelClick);
        this.root.modal?.destroy?.();
        delete window.confirmCustom;
    }
}
