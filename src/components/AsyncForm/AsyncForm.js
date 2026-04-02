import Component from "../Component";
import { MessageToastType } from "../MessageToast/MessageToastType";
import CheckboxNormalizer from "./Normalizers/CheckboxNormalizer";
import Loader from "../Loader/Loader";

export default class AsyncForm extends Component {
    constructor(element) {
        super(element);
        
        const settings = JSON.parse(this.root.dataset.settings || '{}');
        
        this.settings = {
            messageDuration: settings.messageDuration || parseInt(this.root.dataset.messageDuration || '3000')
        };
        this.normalizers = {};
        this.formNormalizers = [CheckboxNormalizer]; // Global form-level normalizers
        this.validators = [];
        this.successHandler = null;
        this.errorHandler = null;

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    init() {
        this.root.noValidate = true;

        this.root.addEventListener('submit', this.handleSubmit);

        if (!this.root.loader) {
            const loader = new Loader(this.root);
            loader.init();
        }

        this.root.asyncForm = {
            setSettings: (settings) => {
                this.settings = { ...this.settings, ...settings };

                return this.root.asyncForm;
            },
            addNormalizer: (field, fn) => {
                this.#addNormalizer(field, fn);

                return this.root.asyncForm;
            },
            addValidator: (fn) => {
                this.#addValidator(fn);

                return this.root.asyncForm;
            },
            setSuccessHandler: (fn) => {
                this.#setSuccessHandler(fn);

                return this.root.asyncForm;
            },
            setErrorHandler: (fn) => {
                this.#setErrorHandler(fn);

                return this.root.asyncForm;
            },
            reset: () => {
                this.reset();

                return this.root.asyncForm;
            },
            destroy: () => this.#destroy()
        };

        this.root.dispatchEvent(new CustomEvent('asyncForm:initialized'));
    }

    #addNormalizer(field, fn) {
        this.normalizers[field] = fn;
    }

    #addValidator(fn) {
        this.validators.push(fn);
    }

    #setSuccessHandler(fn) {
        this.successHandler = fn;
    }

    #setErrorHandler(fn) {
        this.errorHandler = fn;
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.#clearErrors();

        const formData = new FormData(this.root);

        this.#normalizeData(formData);

        if (!this.#isValidFormData(formData)) return;

        this.#activateLoader();

        try {
            let url = this.root.action;
            let method = this.#retrieveMethod(formData);

            let options = {
                method: method,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            };

            if (method === 'GET') {
                const params = new URLSearchParams(formData).toString();
                url += (url.includes('?') ? '&' : '?') + params;
            } else {
                options.body = formData;
            }

            const response = await fetch(url, options);

            if (response.redirected) {
                window.location.href = response.url;

                return;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (response.status >= 300 && response.status < 400) {
                    const locationHeader = response.headers.get('location');
                    if (locationHeader) {
                        window.location.href = locationHeader;

                        return;
                    }
                }

                throw new Error('Server response is not valid JSON');
            }

            const data = await response.json();

            if (response.ok || response.status === 201) {
                this.#handleSuccess(data);
            } else {
                this.#handleBackendError(data);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            this.#showToast('Server communication error', MessageToastType.ERROR);

            if (this.errorHandler) this.errorHandler(error);
        } finally {
            this.#deactivateLoader();
        }
    }

    #retrieveMethod(formData) {
        const originalMethod = (this.root.dataset.method || this.root.method || 'POST').toUpperCase();
        let method = originalMethod;

        // Method spoofing for non-POST/GET methods to ensure $_POST population in PHP
        if (['PATCH', 'PUT', 'DELETE'].includes(originalMethod)) {
            formData.set('_method', originalMethod);
            method = 'POST';
        }

        return method;
    }

    #isValidFormData(formData) {
        let isValid = true;
        for (const validator of this.validators) {
            if (!validator(formData, this.root)) {
                isValid = false;
            }
        }
        return isValid;
    }

    #normalizeData(formData) {
        this.formNormalizers.forEach(normalizer => {
            normalizer(this.root, formData);
        });

        Object.keys(this.normalizers).forEach(field => {
            const value = formData.get(field);
            const newValue = this.normalizers[field](value);
            if (newValue !== undefined && newValue !== null) {
                formData.set(field, newValue);
            }
        });
    }

    #handleSuccess(data) {
        if (this.successHandler) {
            this.successHandler(data);
        } else {
            this.#showToast('Operation completed successfully', MessageToastType.SUCCESS);
        }
    }

    #handleBackendError(data) {
        if (this.errorHandler) {
            this.errorHandler(data);
        }

        const error = data.error || {};

        if (error.message) {
            this.#showToast(error.message, MessageToastType.ERROR);
        }

        if (error.params) {
            Object.entries(error.params).forEach(([fieldId, message]) => {
                this.#showFieldError(fieldId, message);
            });
        }
    }

    #showToast(message, type) {
        const toastTargetSelector = this.root.dataset.toastTarget;

        if (toastTargetSelector) {
            const targetEl = document.querySelector(toastTargetSelector);
            if (targetEl && targetEl.messageToast) {
                targetEl.messageToast.show(message, type, this.settings.messageDuration);
                return;
            } else {
                console.warn(`AsyncForm: Toast target "${toastTargetSelector}" not found or not initialized.`);
            }
        }

        window.dispatchEvent(new CustomEvent('toast:show', {
            detail: { message: message, type: type, duration: this.settings.messageDuration }
        }));
    }

    #hideToast() {
        const toastTargetSelector = this.root.dataset.toastTarget;

        if (!toastTargetSelector) {
            return;
        }

        const targetEl = document.querySelector(toastTargetSelector);
        if (targetEl && targetEl.messageToast) {
            targetEl.messageToast.hide();
        }
    }

    #showFieldError(fieldId, message) {
        const input = this.root.querySelector(`[name="${fieldId}"]`) || document.getElementById(fieldId);

        if (input) {
            let target = input;
            
            // Si el input está oculto (caso de DatePicker con altInput), buscamos su representación visible
            const nextSibling = input.nextElementSibling;
            if ((input.type === 'hidden' || window.getComputedStyle(input).display === 'none') && nextSibling) {
                target = nextSibling;
            }

            target.classList.add('is-invalid');

            const msgEl = document.createElement('span');
            msgEl.className = 'form-error-message';
            msgEl.textContent = message;

            // Insertar después del elemento visible
            target.parentNode.insertBefore(msgEl, target.nextSibling);

            const clearError = () => {
                target.classList.remove('is-invalid');
                msgEl.remove();
                input.removeEventListener('input', clearError);
                // Si el target es distinto, también limpiamos el evento en el target si fuera necesario
                if (target !== input) target.removeEventListener('input', clearError);
            };
            
            input.addEventListener('input', clearError);
            if (target !== input) target.addEventListener('input', clearError);
        }
    }

    #clearErrors() {
        this.root.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        this.root.querySelectorAll('.form-error-message').forEach(el => el.remove());
    }

    #activateLoader() {
        this.root.classList.add('is-loading');
        if (this.root.loader) {
            this.root.loader.show();
        }
    }

    #deactivateLoader() {
        this.root.classList.remove('is-loading');
        if (this.root.loader) {
            this.root.loader.hide();
        }
    }

    reset() {
        this.root.reset();
        this.#clearErrors();
        this.#hideToast();
    }

    #destroy() {
        this.root.removeEventListener('submit', this.handleSubmit);
        delete this.root.asyncForm;
    }
}
