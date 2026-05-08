import Component from "../Component";
import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.bootstrap5.css";
import "./_rich-multi-select.scss";

export default class RichMultiSelect extends Component {
    constructor(element) {
        super(element);
        this.instance = null;

        const settings = JSON.parse(this.root.dataset.settings || '{}');
        this.config = {
            placeholder: settings.placeholder ?? 'Seleccionar…',
            maxItems: settings.maxItems ?? null,
            searchField: settings.searchField ?? 'text',
            remoteUrl: settings.remoteUrl ?? null,
            remoteValueField: settings.remoteValueField ?? 'id',
            remoteLabelField: settings.remoteLabelField ?? 'name',
            noResultsText: settings.noResultsText ?? 'Sin resultados',
            create: settings.create ?? false,
        };
    }

    init() {
        const tsConfig = {
            placeholder: this.config.placeholder,
            maxItems: this.config.maxItems,
            searchField: this.config.searchField.split(',').map((f) => f.trim()),
            create: this.config.create,
            plugins: ['remove_button'],
            render: {
                no_results: () => `<div class="no-results">${this.config.noResultsText}</div>`,
            },
            onChange: (values) => {
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:change', {
                    detail: { values: Array.isArray(values) ? values : (values ? [values] : []) },
                }));
            },
            onItemAdd: (value, $item) => {
                const text = $item?.textContent?.trim() ?? '';
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:item-add', {
                    detail: { value, text },
                }));
            },
            onItemRemove: (value) => {
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:item-remove', {
                    detail: { value },
                }));
            },
            onFocus: () => {
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:focus'));
            },
            onBlur: () => {
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:blur'));
            },
        };

        if (this.config.remoteUrl) {
            tsConfig.valueField = this.config.remoteValueField;
            tsConfig.labelField = this.config.remoteLabelField;
            tsConfig.loadThrottle = 300;
            tsConfig.load = this.#createLoadFn();
        }

        this.instance = new TomSelect(this.root, tsConfig);

        this.root.richMultiSelect = {
            getValue: () => {
                const val = this.instance.getValue();
                return Array.isArray(val) ? val : (val ? [val] : []);
            },
            setValue: (values) => this.instance.setValue(values),
            addOption: (option) => this.instance.addOption(option),
            clear: () => this.instance.clear(),
            destroy: () => this.#destroy(),
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:initialized'));
    }

    #createLoadFn() {
        return (query, callback) => {
            if (query.length < 2) {
                callback();
                return;
            }

            const url = `${this.config.remoteUrl}?q=${encodeURIComponent(query)}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then((data) => callback(data))
                .catch(() => {
                    this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:load-error'));
                    callback();
                });
        };
    }

    #destroy() {
        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
        }
        delete this.root.richMultiSelect;
    }
}
