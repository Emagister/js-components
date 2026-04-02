export default class Component {
    /**
     * @param {HTMLElement} element - The root element of the component
     */
    constructor(element) {
        if (this.constructor === Component) {
            throw new TypeError("You cannot instantiate the abstract class Component directly.");
        }

        if (!element) {
            throw new Error(`No root element provided for the component: ${this.constructor.name}`);
        }

        this.root = element;
    }

    init() {
        throw new Error(`The component "${this.constructor.name}" must implement the init() method.`);
    }
}
