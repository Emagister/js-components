import Component from "../Component";
import TomSelect from "tom-select";

export default class RichMultiSelect extends Component {
    #tomSelect = null;
    #settings = {};
    #debounceTimer = null;

    constructor(element) {
        super(element);
        this.#settings = JSON.parse(element.dataset.settings || '{}');
    }

    init() {
        import('./_rich-multi-select.scss');

        this.#tomSelect = new TomSelect(this.root, this.#buildConfig());

        this.root.richMultiSelect = {
            getValue: () => this.#tomSelect.getValue(),
            setValue: (values) => this.#tomSelect.setValue(values),
            addOption: (option) => this.#tomSelect.addOption(option),
            clear: () => this.#tomSelect.clear(),
            destroy: () => this.#destroy()
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:initialized'));
    }

    #buildConfig() {
        const s = this.#settings;
        const config = {
            placeholder: s.placeholder ?? 'Seleccionar…',
            maxItems: s.maxItems ?? null,
            searchField: s.searchField ?? 'text',
            create: s.create ?? false,
            plugins: ['remove_button'],
            render: {
                no_results: () =>
                    `<div class="rms-no-results">${s.noResultsText ?? 'Sin resultados'}</div>`
            },
            onChange: (values) => {
                this.root.dispatchEvent(
                    new CustomEvent('emg-jsc:richMultiSelect:change', { detail: { values } })
                );
            },
            onItemAdd: (value, $item) => {
                this.root.dispatchEvent(
                    new CustomEvent('emg-jsc:richMultiSelect:item-add', {
                        detail: { value, text: $item?.textContent ?? '' }
                    })
                );
            },
            onItemRemove: (value) => {
                this.root.dispatchEvent(
                    new CustomEvent('emg-jsc:richMultiSelect:item-remove', { detail: { value } })
                );
            },
            onFocus: () => {
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:focus'));
            },
            onBlur: () => {
                this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:blur'));
            }
        };

        if (s.remoteUrl) {
            config.load = this.#buildLoadFn(
                s.remoteUrl,
                s.remoteValueField ?? 'id',
                s.remoteLabelField ?? 'name'
            );
        }

        return config;
    }

    #buildLoadFn(url, valueField, labelField) {
        return (query, callback) => {
            if (query.length < 2) {
                callback([]);
                return;
            }
            clearTimeout(this.#debounceTimer);
            this.#debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`${url}?q=${encodeURIComponent(query)}`);
                    if (!response.ok) {
                        callback([]);
                        return;
                    }
                    const data = await response.json();
                    callback(data.map(item => ({
                        value: String(item[valueField]),
                        text: item[labelField]
                    })));
                } catch {
                    callback([]);
                }
            }, 300);
        };
    }

    #destroy() {
        clearTimeout(this.#debounceTimer);
        if (this.#tomSelect) {
            this.#tomSelect.destroy();
            this.#tomSelect = null;
        }
        delete this.root.richMultiSelect;
    }
}
