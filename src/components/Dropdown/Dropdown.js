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
        };

        this.root.dispatchEvent(new CustomEvent('dropdown:initialized'));
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

    destroy() {
        if (this.bootstrapDropdown) {
            this.bootstrapDropdown.dispose();
            this.bootstrapDropdown = null;
        }

        delete this.root.dropdown;
    }
}

