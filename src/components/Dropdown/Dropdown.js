import Component from "../Component";
import { Dropdown as BootstrapDropdown } from 'bootstrap';

export default class Dropdown extends Component {
    constructor(element) {
        super(element);
        this.bootstrapDropdown = null;
    }

    init() {
        this.bootstrapDropdown = new BootstrapDropdown(this.root);

        this.root.dropdown = {
            show: () => this.show(),
            hide: () => this.hide(),
            toggle: () => this.toggle(),
            destroy: () => this.#destroy()
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:dropdown:initialized'));
    }

    show() {
        if (this.bootstrapDropdown) {
            this.bootstrapDropdown.show();
        }
    }

    hide() {
        if (this.bootstrapDropdown) {
            this.bootstrapDropdown.hide();
        }
    }

    toggle() {
        if (this.bootstrapDropdown) {
            this.bootstrapDropdown.toggle();
        }
    }

    #destroy() {
        if (this.bootstrapDropdown) {
            this.bootstrapDropdown.dispose();
            this.bootstrapDropdown = null;
        }

        delete this.root.dropdown;
    }
}

