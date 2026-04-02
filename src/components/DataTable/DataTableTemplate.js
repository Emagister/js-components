import './_table.scss';

export default class DataTableTemplate {
    constructor() {
        // No longer relying on external document templates
    }

    createContent(state, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';

        const table = document.createElement('table');
        const classes = ['table', 'mb-0'];
        if (config.striped) classes.push('table-striped');
        if (config.hover) classes.push('table-hover');
        table.className = classes.join(' ');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');

        this.#appendHeader(state, config, headerRow);
        this.#appendBody(state, config, tbody);

        table.appendChild(thead);
        table.appendChild(tbody);
        wrapper.appendChild(table);

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'mt-3';
        this.#appendPagination(state.meta, paginationContainer);

        const container = document.createElement('div');
        container.appendChild(wrapper);
        container.appendChild(paginationContainer);

        return container;
    }

    #appendHeader(state, config, headerRow) {
        if (config.headerClass) {
            headerRow.className = config.headerClass;
        }

        for (const col of config.columns) {
            headerRow.appendChild(this.#createTh(state, col));
        }

        if (config.actions && config.actions.length > 0) {
            const actionTh = document.createElement('th');
            actionTh.textContent = 'Acciones';
            headerRow.appendChild(actionTh);
        }
    }

    #createTh(state, col) {
        const th = document.createElement('th');

        const isSorted = state.sortBy === col.key;
        const sortIcon = isSorted ? (state.sortOrder === 'asc' ? ' ↑' : ' ↓') : '';

        th.textContent = col.label + sortIcon;

        if (col.headerClass) {
            th.className = col.headerClass;
        }

        if (col.sortable) {
            th.setAttribute('data-sort', col.key);
            th.style.cursor = 'pointer';
            th.classList.add('sortable-header');
        }

        return th;
    }

    #createTr(id) {
        const tr = document.createElement('tr');
        if (id) {
            tr.setAttribute('data-id', id);
        }
        return tr;
    }

    #createTd(row, col, defaultContent = '') {
        const td = document.createElement('td');
        const cellValue = (row && row[col.key] !== undefined && row[col.key] !== null) ? row[col.key] : defaultContent;

        if (col.link) {
            const a = document.createElement('a');
            a.setAttribute('href', row[col.link]);
            a.textContent = cellValue;
            td.appendChild(a);
            return td;
        }

        if (col.badge) {
            const span = document.createElement('span');
            // Assuming col.badge format is something like "badge bg-%level%"
            const level = row[col.badge] || 'secondary';
            span.className = `badge bg-${level}-subtle text-${level}`;
            span.textContent = cellValue;
            td.appendChild(span);
            return td;
        }

        if (row && typeof row[col.key] === 'boolean') {
            const i = document.createElement('i');
            if (row[col.key]) {
                i.className = 'bi bi-check-lg text-success';
            } else {
                i.className = 'bi bi-x-lg text-danger';
            }
            td.appendChild(i);
            return td;
        }

        td.textContent = cellValue;
        return td;
    }

    #appendBody(state, config, tableBody) {
        if (!state.data || state.data.length === 0) {
            this.#appendNoContent(config, tableBody);
            return;
        }

        for (const row of state.data) {
            const tr = this.#createTr(row.id);
            this.#appendContentCells(row, config, tr);
            tableBody.appendChild(tr);
        }
    }

    #appendContentCells(row, config, tr) {
        for (const col of config.columns) {
            tr.appendChild(this.#createTd(row, col));
        }
        this.#appendActions(row, config, tr);
    }

    #appendActions(row, config, tr) {
        if (!config.actions || !config.actions.length) {
            return;
        }

        const td = document.createElement('td');

        for (const action of config.actions) {
            const activeState = (action.states || []).find(state => !!row[state.key]);

            if (action.states && !activeState) {
                continue;
            }

            const label = activeState ? activeState.label : (action.label || action.name);
            const icon = activeState ? (activeState.icon || 'bi bi-gear') : (action.icon || 'bi bi-gear');

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-link p-0 me-2';
            button.setAttribute('data-action', action.name);
            button.setAttribute('data-component', 'tooltip');
            button.setAttribute('title', label);
            button.setAttribute('aria-label', label);

            const i = document.createElement('i');
            i.className = icon;

            button.appendChild(i);
            td.appendChild(button);
        }

        tr.appendChild(td);
    }

    #appendPagination(meta, paginationContainer) {
        const { page, lastPage } = meta;

        if (lastPage <= 1) {
            return;
        }

        let pages = [];
        for (let i = 1; i <= lastPage; i++) {
            if (i === 1 || i === lastPage || (i >= page - 2 && i <= page + 2)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Page navigation');
        const ul = document.createElement('ul');
        ul.className = 'pagination justify-content-center mb-0';

        ul.appendChild(this.#createPaginationItem(page - 1, 'Anterior', false, page === 1));

        for (const p of pages) {
            ul.appendChild(this.#createPaginationItem(p, p, parseInt(page) === p, p === '...'));
        }

        ul.appendChild(this.#createPaginationItem(page + 1, 'Siguiente', false, page === lastPage));

        nav.appendChild(ul);
        paginationContainer.appendChild(nav);
    }

    #createPaginationItem(pageId, text, active = false, disabled = false) {
        const li = document.createElement('li');
        li.className = 'page-item';

        if (active) {
            li.classList.add('active');
        }
        if (disabled) {
            li.classList.add('disabled');
        }

        const a = document.createElement('a');
        a.className = 'page-link';
        a.textContent = text;

        if (!disabled && text !== '...') {
            a.setAttribute('data-page', pageId);
            a.setAttribute('href', '#');
        }

        li.appendChild(a);
        return li;
    }

    #appendNoContent(config, tableBody) {
        this.#appendMessageRow(config, tableBody, 'No se encontraron resultados.');
    }

    createErrorContent(config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';

        const table = document.createElement('table');
        table.className = 'table';
        const tbody = document.createElement('tbody');

        this.#appendMessageRow(config, tbody, 'Ocurrió un error al cargar los datos.');

        table.appendChild(tbody);
        wrapper.appendChild(table);
        return wrapper;
    }

    #appendMessageRow(config, tableBody, message) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.setAttribute('colspan', config.columns.length + (config.actions && config.actions.length ? 1 : 0));
        td.className = 'text-center py-4 text-muted';
        td.textContent = message;

        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}
