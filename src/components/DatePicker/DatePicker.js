import Component from "../Component";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import "./_datepicker.scss";

export default class DatePicker extends Component {
    constructor(element) {
        super(element);
        this.instance = null;

        const settings = JSON.parse(this.root.dataset.settings || this.root.dataset.options || '{}');

        this.config = {
            dateFormat: settings.dateFormat || this.root.dataset.dateFormat || "Y-m-d",
            allowInput: settings.allowInput !== undefined ? settings.allowInput : true,
            altInput: settings.altInput !== undefined ? settings.altInput : true,
            altFormat: settings.altFormat || this.root.dataset.altFormat || "d/m/Y",
            ...settings
        };
    }

    async init() {
        const locale = this.#getBrowserLocale();
        if (locale !== 'en') {
            try {
                const l10n = await this.#loadLocale(locale);
                if (l10n) {
                    this.config.locale = l10n;
                }
            } catch (e) {
                console.warn(`DatePicker: Could not load locale "${locale}"`, e);
            }
        }

        this.instance = flatpickr(this.root, this.config);

        this.root.dispatchEvent(new CustomEvent('datePicker:initialized'));
    }

    #getBrowserLocale() {
        return (navigator.language || navigator.userLanguage).split('-')[0];
    }

    async #loadLocale(locale) {
        try {
            const module = await import(`flatpickr/dist/l10n/${locale}.js`);

            return module.default[locale] || module[locale] || module.default;
        } catch (e) {
            return null;
        }
    }

    #destroy() {
        if (this.instance) {
            this.instance.destroy();
        }
    }
}
