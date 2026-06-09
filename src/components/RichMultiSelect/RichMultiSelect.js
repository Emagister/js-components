import Component from "../Component";
import TomSelect from "tom-select";

const SEARCH_DEBOUNCE_DELAY_MS = 300;

export default class RichMultiSelect extends Component {
    #tomSelect = null;
    #settings = {};
    #debounceTimer = null;
    #destroyed = false;

    constructor(element) {
        super(element);
        try {
            this.#settings = JSON.parse(element.dataset.settings || '{}');
        } catch {
            this.#settings = {};
        }
    }

    init() {
        import('./_rich-multi-select.scss');

        this.#tomSelect = new TomSelect(this.root, this.#buildConfig());

        const s = this.#settings;
        if (s.placeholderWithItems != null && this.#tomSelect.getValue().length > 0) {
            this.#tomSelect.settings.placeholder = s.placeholderWithItems;
            this.#tomSelect.control_input.placeholder = s.placeholderWithItems;
        }

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
        const settings = this.#settings;
        const config = {
            placeholder: settings.placeholder ?? 'Seleccionar…',
            maxItems: settings.maxItems ?? null,
            searchField: settings.searchField ?? 'text',
            create: settings.create ?? false,
            plugins: ['remove_button'],
            render: {
                no_results: () => {
                    const noResultsEl = document.createElement('div');
                    noResultsEl.className = 'rms-no-results';
                    noResultsEl.textContent = settings.noResultsText ?? 'Sin resultados';
                    return noResultsEl.outerHTML;
                }
            },
            onChange: (values) => {
                if (s.placeholderWithItems != null && this.#tomSelect) {
                    const ph = values.length > 0
                        ? s.placeholderWithItems
                        : (s.placeholder ?? 'Seleccionar…');
                    this.#tomSelect.settings.placeholder = ph;
                    this.#tomSelect.control_input.placeholder = ph;
                }
                this.root.dispatchEvent(
                    new CustomEvent('emg-jsc:richMultiSelect:change', { detail: { values } })
                );
            },
            onItemAdd: (value, $item) => {
                if (s.clearInputOnSelect && this.#tomSelect) {
                    this.#tomSelect.setTextboxValue('');
                    this.#tomSelect.refreshOptions(false);
                }
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

        if (settings.remoteUrl) {
            config.load = this.#buildLoadFn(
                settings.remoteUrl,
                settings.remoteValueField ?? 'id',
                settings.remoteLabelField ?? 'name'
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
                    if (this.#destroyed) return;
                    if (!response.ok) {
                        this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:load-error'));
                        callback([]);
                        return;
                    }
                    const remoteOptions = await response.json();
                    callback(remoteOptions.map(item => ({
                        value: String(item[valueField]),
                        text: item[labelField]
                    })));
                } catch {
                    if (this.#destroyed) return;
                    this.root.dispatchEvent(new CustomEvent('emg-jsc:richMultiSelect:load-error'));
                    callback([]);
                }
            }, SEARCH_DEBOUNCE_DELAY_MS);
        };
    }

    #destroy() {
        this.#destroyed = true;
        clearTimeout(this.#debounceTimer);
        if (this.#tomSelect) {
            this.#tomSelect.destroy();
            this.#tomSelect = null;
        }
        delete this.root.richMultiSelect;
    }
}
