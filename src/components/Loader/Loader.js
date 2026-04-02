import Component from "../Component";
import "./_loader.scss";

export default class Loader extends Component {
    constructor(element) {
        super(element);
        this.overlay = null;
        this.handleShow = this.show.bind(this);
        this.handleHide = this.hide.bind(this);
    }

    init() {
        this.#createOverlay();
        this.#ensureRelativePosition();

        this.root.loader = {
            show: this.handleShow,
            hide: this.handleHide,
            destroy: () => this.#destroy()
        };

        this.root.addEventListener('loader:show', this.handleShow);
        this.root.addEventListener('loader:hide', this.handleHide);

        this.root.dispatchEvent(new CustomEvent('loader:initialized'));
    }

    show() {
        if (this.overlay) {
            this.overlay.classList.add('is-visible');
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('is-visible');
        }
    }

    #createOverlay() {
        if (this.root.querySelector('.loader-overlay')) {
            this.overlay = this.root.querySelector('.loader-overlay');
            return;
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'loader-overlay';

        const spinner = document.createElement('div');
        spinner.className = 'loader-spinner';
        spinner.setAttribute('role', 'status');

        const srOnly = document.createElement('span');
        srOnly.className = 'visually-hidden';
        srOnly.textContent = 'Cargando...';

        spinner.appendChild(srOnly);
        this.overlay.appendChild(spinner);
        this.root.appendChild(this.overlay);
    }

    #ensureRelativePosition() {
        const style = window.getComputedStyle(this.root);
        if (style.position === 'static') {
            this.root.style.position = 'relative';
        }
    }

    #destroy() {
        if (this.overlay) {
            this.overlay.remove();
        }

        this.root.removeEventListener('loader:show', this.handleShow);
        this.root.removeEventListener('loader:hide', this.handleHide);

        delete this.root.loader;
    }
}
