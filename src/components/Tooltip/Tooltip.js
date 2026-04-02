import Component from '../Component';
import { Tooltip as BootstrapTooltip } from 'bootstrap';

export default class Tooltip extends Component {
    constructor(element) {
        super(element);
    }

    init() {
        this.bootstrapTooltip = new BootstrapTooltip(this.root);

        this.root.tooltip = {
            destroy: () => this.#destroy()
        };

        this.root.dispatchEvent(new CustomEvent('tooltip:initialized'));
    }

    #destroy() {
        this.bootstrapTooltip.dispose();
    }
}
