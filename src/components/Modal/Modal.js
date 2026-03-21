import Component from '../Component';
import { Modal as BootstrapModal } from 'bootstrap';

export default class Modal extends Component {
    constructor(element) {
        super(element);
        this.init();
    }

    init() {
        this.bootstrapModal = new BootstrapModal(this.root);

        this.root.modal = {
            show: this.#show.bind(this),
            hide: this.#hide.bind(this),
            destroy: this.#destroy.bind(this)
        };

        this.root.addEventListener('hide.bs.modal', () => {
            if (this.root.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        });

        this.root.dispatchEvent(new CustomEvent('modal:initialized'));
    }

    #show() {
        this.bootstrapModal.show();
    }

    #hide() {
        this.bootstrapModal.hide();
    }

    #destroy() {
        this.bootstrapModal.dispose();
    }
}
