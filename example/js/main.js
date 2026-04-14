// --- Simulation Interceptor for Demo ---
const originalFetch = window.fetch;
const delay = ms => new Promise(res => setTimeout(res, ms));

// In-memory store of deleted IDs for the demo
const deletedIds = new Set();

window.fetch = async (url, options) => {
    const urlObj = new URL(url, window.location.origin);

    // Simulation for DataTable Pagination
    if (urlObj.pathname.includes('datatableData.json')) {
        await delay(800); // Artificial delay to see the loader
        const page = parseInt(urlObj.searchParams.get('page') || '1');
        const limit = parseInt(urlObj.searchParams.get('limit') || '10');

        const response = await originalFetch(urlObj.pathname, options);
        const fullData = await response.json();

        // Filter out records deleted during this session
        const remaining = fullData.data.filter(item => !deletedIds.has(String(item.id)));

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedItems = remaining.slice(start, end);

        return new Response(JSON.stringify({
            data: paginatedItems,
            meta: {
                total: remaining.length,
                page: page,
                perPage: limit
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Simulation for DataTable Bulk Delete
    if (urlObj.pathname.includes('bulkDelete')) {
        await delay(600);
        const body = JSON.parse(options?.body || '{}');
        const ids = body.ids || [];
        ids.forEach(id => deletedIds.add(String(id)));

        return new Response(JSON.stringify({ deleted: ids.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Simulations for AsyncForm Errors
    if (url.includes('simulate-error')) {
        await delay(800); // Artificial delay to see the form loader
        const data = await (await originalFetch(url, options)).json();

        return new Response(JSON.stringify(data), {
            status: 422,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return originalFetch(url, options);
};
// ----------------------------------------

import { ComponentManager } from '../../src';
import { MessageToastType } from '../../src/components/MessageToast/MessageToastType';
// import '@emagister/js-components/style.css';
import '../scss/styles.scss';

// Initialize the library automatically with Dynamic Loading
const app = new ComponentManager();
app.start();

// DataTable bulk delete events (registered at module level — DOMContentLoaded is not reliable for module scripts)
document.addEventListener('emg-jsc:datatable:bulk-delete:success', (e) => {
    window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { message: `${e.detail.count} registro(s) eliminado(s) correctamente`, type: MessageToastType.SUCCESS, duration: 3000 }
    }));
});
document.addEventListener('emg-jsc:datatable:bulk-delete:error', () => {
    window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { message: 'Error al eliminar los registros seleccionados', type: MessageToastType.ERROR, duration: 3000 }
    }));
});

// Custom logic for the example page
document.addEventListener('DOMContentLoaded', () => {

    // Modal
    const modalElement = document.getElementById('example-modal');
    document.getElementById('open-modal-btn').addEventListener('click', () => {
        modalElement.modal.show();
    });

    // Confirm
    document.getElementById('confirm-action-btn').addEventListener('click', async () => {
        const confirmed = await window.confirmCustom('¿Quieres ejecutar esta acción peligrosa?', 'Atención');
        if (confirmed) {
            alert('Acción confirmada');
        }
    });

    // MessageToast logic
    // The ComponentManager class will automatically mount the MessageToast on #toast-container
    const showToast = (message, type = MessageToastType.SUCCESS) => {
        window.dispatchEvent(new CustomEvent('toast:show', {
            detail: { message, type, duration: 3000 }
        }));
    };

    document.getElementById('show-toast-success-btn').addEventListener('click', () => {
        showToast('¡La librería funciona correctamente. Success!', MessageToastType.SUCCESS);
    });

    document.getElementById('show-toast-warning-btn').addEventListener('click', () => {
        showToast('¡La librería funciona correctamente. Warning!', MessageToastType.WARNING);
    });

    document.getElementById('show-toast-error-btn').addEventListener('click', () => {
        showToast('¡La librería funciona correctamente. Error!', MessageToastType.ERROR);
    });

    // Tooltips are handled automatically by the ComponentManager class
    // because we added data-component="tooltip" in the HTML.

    // Loader
    const loaderBtn = document.getElementById('show-loader-btn');
    const loaderContainer = document.getElementById('loader-test-container');

    loaderBtn.addEventListener('click', () => {
        const loaderEl = loaderContainer.querySelector('.card-body');
        if (loaderEl && loaderEl.loader) {
            loaderEl.loader.show();
            setTimeout(() => {
                loaderEl.loader.hide();
            }, 3000);
        }
    });

    // AsyncForm custom handlers
    const asyncFormEl = document.getElementById('example-async-form');
    // We wait for the component to be initialized by the manager
    asyncFormEl.addEventListener('asyncForm:initialized', () => {
        if (asyncFormEl.asyncForm) {
            asyncFormEl.asyncForm.setSuccessHandler((data) => {
                // If we have a targeted toast, AsyncForm handles it automatically
                // unless we override the success handler and don't call it.
                // Here we can add extra logic:
                console.log('Form data received:', data);

                // We can still use the global toast if we want, but the 
                // targeted one will also be triggered by the internal logic
                // if we don't have a success handler. 
                // Since we HAVE a success handler, we should trigger the toast manually if we want it.

                const target = document.querySelector(asyncFormEl.dataset.toastTarget);
                if (target && target.messageToast) {
                    target.messageToast.show(data.message || 'Enviado correctamente', MessageToastType.SUCCESS);
                } else {
                    showToast(data.message || '¡Formulario enviado!', MessageToastType.SUCCESS);
                }
            });
        }
    });

    // Buttons to change form behavior (simulation)
    const baseUrl = 'http://localhost:5173/example/';
    document.getElementById('btn-submit-success')?.addEventListener('click', () => {
        asyncFormEl.action = baseUrl + 'formResponse.json';
    });
    document.getElementById('btn-submit-fields')?.addEventListener('click', () => {
        asyncFormEl.action = baseUrl + 'formErrorParams.json?simulate-error';
    });
    document.getElementById('btn-submit-general')?.addEventListener('click', () => {
        asyncFormEl.action = baseUrl + 'formErrorGeneral.json?simulate-error';
    });
});
