import ComponentRegistry from "./ComponentRegistry";

export default class ComponentManager {
    constructor() {
        this.registry = ComponentRegistry;
        this.instances = new WeakMap();
    }

    /**
     * Bootstraps the application by scanning the DOM for components
     */
    start() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Internal initialization
     */
    init() {
        this.#mountAll(document.body);
        this.#observeDOM();
        this.#listenScanEvent();

        window.dispatchEvent(new CustomEvent('app:initialized'));
    }

    #mountAll(root) {
        Object.keys(this.registry).forEach((name) => {
            root.querySelectorAll(`[data-component~="${name}"]`).forEach((element) => {
                this.#checkAndMount(element, name);
            });
        });
    }

    #mount(element, ComponentClass) {
        if (!this.instances.has(element)) {
            this.instances.set(element, new Map());
        }

        const componentInstances = this.instances.get(element);
        if (componentInstances.has(ComponentClass)) {
            return;
        }

        const instance = new ComponentClass(element);
        if (typeof instance.init === 'function') {
            instance.init();
        }

        componentInstances.set(ComponentClass, instance);
    }

    #listenScanEvent() {
        document.body.addEventListener('component:scan', (e) => {
            this.#mountAll(e.target);
        });
    }

    #observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.#scanElement(node);
                        this.#mountAll(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    #scanElement(element) {
        const componentNames = (element.dataset.component || '').split(/\s+/);
        componentNames.forEach(name => {
            if (name && this.registry[name]) {
                this.#checkAndMount(element, name);
            }
        });
    }

    async #checkAndMount(element, name) {
        if (!this.registry[name]) return;

        try {
            const module = await this.registry[name]();
            const ComponentClass = module.default;

            this.#mount(element, ComponentClass);
        } catch (error) {
            console.error(`Failed to load component "${name}":`, error);
        }
    }
}
