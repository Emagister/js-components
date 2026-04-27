import Component from "../Component";
import DataTableTemplate from "./DataTableTemplate";
import Loader from "../Loader/Loader";
import "./_table.scss";

export default class DataTable extends Component {
    constructor(element) {
        super(element);

        const settings = JSON.parse(this.root.dataset.settings || '{}');

        this.config = {
            url: this.root.dataset.url,
            columns: JSON.parse(this.root.dataset.columns || '[]'),
            actions: JSON.parse(this.root.dataset.actions || '[]'),
            perPage: parseInt(settings.perPage || this.root.dataset.perPage || '10'),
            filterFormId: settings.filterForm?.id || settings.filterFormId || this.root.dataset.filterForm,
            filterResetButtonId: settings.filterForm?.resetButtonId || null,
            sortBy: settings.sortBy || this.root.dataset.sortBy || null,
            sortOrder: settings.sortOrder || this.root.dataset.sortOrder || 'asc',
            striped: settings.striped !== undefined ? settings.striped : false,
            hover: settings.hover !== undefined ? settings.hover : true,
            headerClass: settings.headerClass || null,
            scrollOffset: parseInt(settings.scrollOffset, 10) || 0,
            bulkDeleteUrl: settings.bulkDeleteUrl || this.root.dataset.bulkDeleteUrl || null,
            pageSizeOptions: settings.pageSizeOptions || [10, 25, 50, 100],
            actionsWidth: settings.actionsWidth ?? '80px',
            labels: {
                total: settings.labels?.total ?? 'Mostrando {from} - {to} de {total} resultados',
                noResults: settings.labels?.noResults ?? 'No se encontraron resultados.',
                error: settings.labels?.error ?? 'Ocurrió un error al cargar los datos.',
                previous: settings.labels?.previous ?? 'Anterior',
                next: settings.labels?.next ?? 'Siguiente',
                actions: settings.labels?.actions ?? 'Acciones',
                bulkDelete: settings.labels?.bulkDelete ?? 'Eliminar seleccionados',
                perPage: settings.labels?.perPage ?? 'Filas por página:',
            },
        };

        this.state = {
            data: [],
            meta: {
                page: 1,
                total: 0,
                perPage: this.config.perPage,
                lastPage: 1
            },
            filters: {},
            sortBy: this.config.sortBy,
            sortOrder: this.config.sortOrder, // asc, desc
            isLoading: false,
            selectedIds: new Set(),
        };

        this.handleSort = this.handleSort.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleAction = this.handleAction.bind(this);
        this.templating = new DataTableTemplate(this.root);
    }

    init() {
        this.loader = new Loader(this.root);
        this.loader.init();

        this.contentWrapper = document.createElement('div');
        this.root.appendChild(this.contentWrapper);

        this.#initializeFilters();
        this.#fetchData();
        this.#bindEvents();
        this.#bindFilterForm();

        this.root.dataTable = {
            destroy: () => this.#destroy()
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:datatable:initialized'));
    }

    #initializeFilters() {
        if (!this.config.filterFormId) return;

        const form = document.getElementById(this.config.filterFormId);
        if (form) {
            this.#setState({ filters: this.#getFormData(form) });
        }
    }

    #bindFilterForm() {
        if (!this.config.filterFormId) return;

        const form = document.getElementById(this.config.filterFormId);
        if (!form) {
            console.warn(`DataTable: Filter form with id "${this.config.filterFormId}" not found.`);
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.setFilters(this.#getFormData(form));
        });

        if (this.config.filterResetButtonId) {
            const resetButton = document.getElementById(this.config.filterResetButtonId);
            if (resetButton) {
                this._onResetClick = (e) => {
                    e.preventDefault();
                    form.reset();
                    this.setFilters(this.#getFormData(form));
                };
                resetButton.addEventListener('click', this._onResetClick);
                this._resetButton = resetButton;
            } else {
                console.warn(`DataTable: Reset button with id "${this.config.filterResetButtonId}" not found.`);
            }
        }
    }

    #getFormData(form) {
        const formData = new FormData(form);
        const filters = {};

        formData.forEach((value, key) => {
            filters[key] = value;
        });

        return filters;
    }

    #bindEvents() {
        this._onRootClick = (e) => {
            const selectAllCheckbox = e.target.closest('[data-select-all]');
            if (selectAllCheckbox) {
                this.#handleSelectAll(selectAllCheckbox.checked);
                return;
            }

            const selectCheckbox = e.target.closest('[data-select-id]');
            if (selectCheckbox) {
                this.#handleSelectRow(selectCheckbox.dataset.selectId, selectCheckbox.checked);
                return;
            }

            const bulkDeleteBtn = e.target.closest('[data-bulk-delete]');
            if (bulkDeleteBtn) {
                this.#handleBulkDelete();
                return;
            }

            const sortHeader = e.target.closest('[data-sort]');
            if (sortHeader) {
                this.handleSort(sortHeader.dataset.sort);
            }

            const pageLink = e.target.closest('[data-page]');
            if (pageLink) {
                e.preventDefault();
                this.handlePageChange(parseInt(pageLink.dataset.page));
            }

            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const rowId = actionBtn.closest('tr').dataset.id;
                this.handleAction(action, rowId);
            }
        };

        this._onRefresh = () => this.#fetchData();
        this._onLoaderShow = () => this.loader.show();
        this._onLoaderHide = () => this.loader.hide();

        this._onRootChange = (e) => {
            const perPageSelect = e.target.closest('[data-per-page]');
            if (perPageSelect) {
                const perPage = Number(perPageSelect.value);
                if (!Number.isFinite(perPage) || !Number.isInteger(perPage) || perPage <= 0) {
                    return;
                }
                this.handlePerPageChange(perPage);
            }
        };

        this.root.addEventListener('click', this._onRootClick);
        this.root.addEventListener('change', this._onRootChange);
        this.root.addEventListener('emg-jsc:datatable:refresh', this._onRefresh);
        this.root.addEventListener('emg-jsc:datatable:loader:show', this._onLoaderShow);
        this.root.addEventListener('emg-jsc:datatable:loader:hide', this._onLoaderHide);
    }

    #handleSelectAll(checked) {
        const newSelected = new Set(this.state.selectedIds);
        const pageIds = this.state.data.map(row => String(row.id));

        if (checked) {
            pageIds.forEach(id => newSelected.add(id));
        } else {
            pageIds.forEach(id => newSelected.delete(id));
        }

        this.#setState({ selectedIds: newSelected });
        this.#updateBulkUI();
    }

    #handleSelectRow(id, checked) {
        const newSelected = new Set(this.state.selectedIds);

        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }

        this.#setState({ selectedIds: newSelected });
        this.#updateBulkUI();
    }

    #updateBulkUI() {
        if (!this.config.bulkDeleteUrl) return;

        const count = this.state.selectedIds.size;

        // Update individual checkboxes
        this.root.querySelectorAll('[data-select-id]').forEach(checkbox => {
            checkbox.checked = this.state.selectedIds.has(checkbox.dataset.selectId);
        });

        // Update select-all checkbox
        const selectAllCheckbox = this.root.querySelector('[data-select-all]');
        if (selectAllCheckbox) {
            const totalRows = this.state.data.length;
            const selectedInPage = this.state.data.filter(row =>
                this.state.selectedIds.has(String(row.id))
            ).length;
            selectAllCheckbox.checked = totalRows > 0 && selectedInPage === totalRows;
            selectAllCheckbox.indeterminate = selectedInPage > 0 && selectedInPage < totalRows;
        }

        // Update bulk actions bar
        const bulkBar = this.root.querySelector('.datatable-bulk-actions');
        if (bulkBar) {
            bulkBar.classList.toggle('d-none', count === 0);
            const btn = bulkBar.querySelector('[data-bulk-delete]');
            if (btn) {
                btn.textContent = `${this.config.labels.bulkDelete} (${count})`;
            }
        }
    }

    async #handleBulkDelete() {
        if (!this.config.bulkDeleteUrl || this.state.selectedIds.size === 0) return;

        const ids = [...this.state.selectedIds];

        this.loader.show();
        try {
            const response = await fetch(this.config.bulkDeleteUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ ids }),
            });

            if (!response.ok) {
                throw new Error('Bulk delete failed');
            }

            this.#setState({ selectedIds: new Set() });
            this.root.dispatchEvent(new CustomEvent('emg-jsc:datatable:bulk-delete:success', {
                bubbles: true,
                detail: { count: ids.length },
            }));
            this.#fetchData();

        } catch (error) {
            this.loader.hide();
            console.error('DataTable bulk delete error:', error);
            this.root.dispatchEvent(new CustomEvent('emg-jsc:datatable:bulk-delete:error', {
                bubbles: true,
                detail: { error },
            }));
        }
    }

    async #fetchData() {
        if (this.state.isLoading) return;
        this.#setState({ isLoading: true });
        this.loader.show();

        try {
            const queryParams = new URLSearchParams({
                page: this.state.meta.page,
                limit: this.state.meta.perPage,
                sort: this.state.sortBy || '',
                order: this.state.sortOrder,
                ...this.state.filters
            });

            const response = await fetch(`${this.config.url}?${queryParams.toString()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();

            // Expected format: { data: [...], meta: { page: 1, total: 100, perPage: 10 } }
            const currentPage = this.state.meta.page;
            const lastPage = result.meta.perPage !== 0 ? Math.ceil(result.meta.total / result.meta.perPage) : 0;

            if (lastPage >= 1 && currentPage > lastPage) {
                this.#setState({ meta: { ...this.state.meta, page: lastPage }, isLoading: false });
                this.#fetchData();
                return;
            }

            this.#setState({
                data: result.data,
                meta: {
                    ...this.state.meta,
                    ...result.meta,
                    lastPage
                },
                isLoading: false
            });

            this.loader.hide();
            this.#render();

        } catch (error) {
            console.error('DataTable fetch error:', error);
            this.#setState({ isLoading: false });
            this.loader.hide();
            this.#renderError();
        }
    }

    #setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    handleSort(columnKey) {
        const isSameColumn = this.state.sortBy === columnKey;
        const newOrder = isSameColumn && this.state.sortOrder === 'asc' ? 'desc' : 'asc';

        this.#setState({
            sortBy: columnKey,
            sortOrder: newOrder,
            meta: { ...this.state.meta, page: 1 }
        });

        this.#fetchData();
    }

    handlePageChange(page) {
        if (page < 1 || page > this.state.meta.lastPage || page === this.state.meta.page) {
            return;
        }

        this.#setState({
            meta: { ...this.state.meta, page: page }
        });

        const top = this.root.getBoundingClientRect().top + window.scrollY - this.config.scrollOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        this.#fetchData();
    }

    setFilters(filters) {
        this.#setState({
            filters: filters,
            meta: { ...this.state.meta, page: 1 }
        });
        this.#fetchData();
    }

    handlePerPageChange(perPage) {
        const normalizedPerPage = Number(perPage);
        if (!Number.isFinite(normalizedPerPage) || !Number.isInteger(normalizedPerPage) || normalizedPerPage <= 0) {
            return;
        }
        if (normalizedPerPage === this.state.meta.perPage) {
            return;
        }
        this.#setState({
            meta: { ...this.state.meta, perPage: normalizedPerPage, page: 1 }
        });
        const top = this.root.getBoundingClientRect().top + window.scrollY - this.config.scrollOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        this.#fetchData();
    }

    handleAction(action, id) {
        const event = new CustomEvent('emg-jsc:datatable:action', {
            bubbles: true,
            detail: { action, id, row: this.state.data.find(r => r.id == id) }
        });
        this.root.dispatchEvent(event);
    }

    #render() {
        this.contentWrapper.innerHTML = '';
        this.contentWrapper.appendChild(this.templating.createContent(this.state, this.config));
        this.#updateBulkUI();
        this.root.dispatchEvent(new CustomEvent('emg-jsc:component:scan', { bubbles: true }));
    }


    #renderError() {
        this.contentWrapper.innerHTML = '';
        this.contentWrapper.appendChild(this.templating.createErrorContent(this.config));
        this.root.dispatchEvent(new CustomEvent('emg-jsc:component:scan', { bubbles: true }));
    }

    #destroy() {
        this.root.removeEventListener('click', this._onRootClick);
        this.root.removeEventListener('change', this._onRootChange);
        this.root.removeEventListener('emg-jsc:datatable:refresh', this._onRefresh);
        this.root.removeEventListener('emg-jsc:datatable:loader:show', this._onLoaderShow);
        this.root.removeEventListener('emg-jsc:datatable:loader:hide', this._onLoaderHide);
        if (this._resetButton && this._onResetClick) {
            this._resetButton.removeEventListener('click', this._onResetClick);
        }
        this.loader?.destroy?.();
        this.contentWrapper.innerHTML = '';
    }
}
