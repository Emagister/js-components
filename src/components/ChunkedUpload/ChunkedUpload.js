import Component from '../Component';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import './_chunked-upload.scss';

const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;
const DEFAULT_RETRY_DELAYS = [0, 1000, 3000, 5000];

export default class ChunkedUpload extends Component {
    #uppy = null;
    #fileInputEl = null;
    #dropzoneEl = null;
    #fileListEl = null;
    #actionsEl = null;
    #errorAlertEl = null;
    #fileItemMap = new Map();

    #onBrowseClick = () => this.#fileInputEl?.click();

    #onFileInputChange = (e) => {
        if (e.target.files?.length) {
            Array.from(e.target.files).forEach((file) => {
                try {
                    this.#uppy.addFile({ name: file.name, type: file.type, data: file, size: file.size });
                } catch { /* restriction-failed event se dispara via Uppy */ }
            });
            e.target.value = '';
        }
    };

    #onDragOver = (e) => {
        e.preventDefault();
        this.#dropzoneEl?.classList.add('is-dragging');
    };

    #onDragLeave = () => this.#dropzoneEl?.classList.remove('is-dragging');

    #onDrop = (e) => {
        e.preventDefault();
        this.#dropzoneEl?.classList.remove('is-dragging');
        if (e.dataTransfer?.files?.length) {
            Array.from(e.dataTransfer.files).forEach((file) => {
                try {
                    this.#uppy.addFile({ name: file.name, type: file.type, data: file, size: file.size });
                } catch { /* restriction-failed event se dispara via Uppy */ }
            });
        }
    };

    #onUploadBtnClick = () => this.#uppy.upload();

    #onCancelBtnClick = () => {
        this.#uppy.cancelAll();
        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:cancel-all'));
    };

    constructor(element) {
        super(element);
        try {
            this.settings = {
                chunkSize: DEFAULT_CHUNK_SIZE,
                maxFileSize: DEFAULT_MAX_FILE_SIZE,
                retryDelays: DEFAULT_RETRY_DELAYS,
                parallelUploads: 1,
                autoProceed: false,
                allowedFileTypes: null,
                labels: {},
                ...JSON.parse(element.dataset.settings || '{}'),
            };
        } catch {
            this.settings = {
                chunkSize: DEFAULT_CHUNK_SIZE,
                maxFileSize: DEFAULT_MAX_FILE_SIZE,
                retryDelays: DEFAULT_RETRY_DELAYS,
                parallelUploads: 1,
                autoProceed: false,
                allowedFileTypes: null,
                labels: {},
            };
        }
    }

    init() {
        if (!this.settings.endpoint) {
            throw new Error('ChunkedUpload: el setting "endpoint" es requerido.');
        }

        this.#buildUI();
        this.#initUppy();
        this.#attachDOMListeners();

        this.root.chunkedUpload = {
            upload: () => { this.#uppy.upload(); return this.root.chunkedUpload; },
            cancelAll: () => { this.#uppy.cancelAll(); this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:cancel-all')); return this.root.chunkedUpload; },
            reset: () => { this.#reset(); return this.root.chunkedUpload; },
            openFilePicker: () => { this.#fileInputEl?.click(); return this.root.chunkedUpload; },
            addFiles: (files) => { this.#addFiles(files); return this.root.chunkedUpload; },
            destroy: () => this.#destroy(),
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:initialized'));
    }

    #buildUI() {
        const s = this.settings;
        const accept = s.allowedFileTypes?.length ? ` accept="${s.allowedFileTypes.join(',')}"` : '';
        const dropzoneLabel = s.labels.dropzone || 'Arrastra el fichero aquí o haz clic para seleccionar';
        const iconClass = s.labels.icon || 'bi-cloud-upload';
        const subtitle = s.labels.dropzoneSubtitle
            ? `<p class="cu-dropzone-subtitle text-muted small mb-2">${s.labels.dropzoneSubtitle}</p>`
            : '';
        const selectFileButton = s.labels.selectFileButton || 'Seleccionar fichero';
        const uploadFileButton = s.labels.uploadFileButton || 'Subir';
        const cancelButton = s.labels.cancelButton || 'Cancelar';

        this.root.innerHTML = `
            <div class="chunked-upload">
                <div class="cu-dropzone border border-2 rounded-3 p-4 text-center mb-3">
                    <input type="file" class="cu-file-input visually-hidden"${accept}>
                    <i class="bi ${iconClass} fs-2 text-muted d-block mb-2"></i>
                    <p class="cu-dropzone-label text-muted mb-2">${dropzoneLabel}</p>
                    ${subtitle}
                    <button type="button" class="btn btn-outline-primary btn-sm cu-browse-btn">${selectFileButton}</button>
                </div>
                <ul class="cu-file-list list-unstyled mb-3 d-none"></ul>
                <div class="cu-actions d-flex gap-2 d-none">
                    <button type="button" class="btn btn-primary btn-sm cu-upload-btn"><i class="bi bi-upload me-1"></i>${uploadFileButton}</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm cu-cancel-btn">${cancelButton}</button>
                </div>
                <div class="alert alert-danger cu-error-alert d-none mt-2" role="alert"></div>
            </div>
        `;

        this.#dropzoneEl = this.root.querySelector('.cu-dropzone');
        this.#fileInputEl = this.root.querySelector('.cu-file-input');
        this.#fileListEl = this.root.querySelector('.cu-file-list');
        this.#actionsEl = this.root.querySelector('.cu-actions');
        this.#errorAlertEl = this.root.querySelector('.cu-error-alert');

        if (s.autoProceed) {
            this.root.querySelector('.cu-upload-btn').classList.add('d-none');
        }
    }

    #initUppy() {
        const s = this.settings;

        this.#uppy = new Uppy({
            restrictions: {
                maxFileSize: s.maxFileSize,
                allowedFileTypes: s.allowedFileTypes,
                maxNumberOfFiles: 1,
            },
            autoProceed: s.autoProceed,
        }).use(Tus, {
            endpoint: s.endpoint,
            chunkSize: s.chunkSize,
            retryDelays: s.retryDelays,
            limit: s.parallelUploads,
        });

        this.#uppy
            .on('file-added', (file) => this.#onFileAdded(file))
            .on('upload-progress', (file, progress) => this.#onUploadProgress(file, progress))
            .on('upload-success', (file, response) => this.#onUploadSuccess(file, response))
            .on('upload-error', (file, error) => this.#onUploadError(file, error))
            .on('complete', (result) => this.#onComplete(result))
            .on('restriction-failed', (file, error) => this.#onRestrictionFailed(file, error));
    }

    #attachDOMListeners() {
        this.root.querySelector('.cu-browse-btn')?.addEventListener('click', this.#onBrowseClick);
        this.#fileInputEl?.addEventListener('change', this.#onFileInputChange);
        this.#dropzoneEl?.addEventListener('dragover', this.#onDragOver);
        this.#dropzoneEl?.addEventListener('dragleave', this.#onDragLeave);
        this.#dropzoneEl?.addEventListener('drop', this.#onDrop);
        this.root.querySelector('.cu-upload-btn')?.addEventListener('click', this.#onUploadBtnClick);
        this.root.querySelector('.cu-cancel-btn')?.addEventListener('click', this.#onCancelBtnClick);
    }

    #onFileAdded(file) {
        this.#clearError();

        const li = document.createElement('li');
        li.className = 'cu-file-item d-flex align-items-center gap-2 mb-2';
        li.dataset.fileId = file.id;
        li.innerHTML = `
            <i class="bi bi-file-earmark text-muted"></i>
            <span class="cu-file-name text-truncate flex-grow-1 small">${file.name}</span>
            <span class="cu-file-size text-muted small">${this.#formatBytes(file.size)}</span>
            <div class="progress flex-grow-1 d-none" style="height: 6px;">
                <div class="progress-bar cu-progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
            <span class="cu-file-status badge bg-secondary">En cola</span>
            <button type="button" class="btn-close btn-sm cu-file-remove" aria-label="Eliminar"></button>
        `;

        li.querySelector('.cu-file-remove').addEventListener('click', () => {
            this.#uppy.removeFile(file.id);
            li.remove();
            this.#fileItemMap.delete(file.id);
            if (this.#fileItemMap.size === 0) {
                this.#fileListEl.classList.add('d-none');
                this.#actionsEl.classList.add('d-none');
            }
        });

        this.#fileListEl.appendChild(li);
        this.#fileItemMap.set(file.id, li);
        this.#fileListEl.classList.remove('d-none');
        this.#actionsEl.classList.remove('d-none');

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:file-added', { detail: { file } }));
    }

    #onUploadProgress(file, progress) {
        const li = this.#fileItemMap.get(file.id);
        if (li) {
            li.querySelector('.progress')?.classList.remove('d-none');
            const bar = li.querySelector('.cu-progress-bar');
            if (bar) bar.style.width = `${progress.percentage}%`;
            const badge = li.querySelector('.cu-file-status');
            if (badge) {
                badge.className = 'cu-file-status badge bg-primary';
                badge.textContent = 'Subiendo…';
            }
        }

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:progress', {
            detail: { file, progress },
        }));
    }

    #onUploadSuccess(file, response) {
        const li = this.#fileItemMap.get(file.id);
        if (li) {
            const bar = li.querySelector('.cu-progress-bar');
            if (bar) bar.style.width = '100%';
            const badge = li.querySelector('.cu-file-status');
            if (badge) {
                badge.className = 'cu-file-status badge bg-success';
                badge.textContent = 'Completado';
            }
        }

        const uploadURL = response?.uploadURL;
        const uploadId = uploadURL
            ? new URL(uploadURL).pathname.split('/').filter(Boolean).pop() ?? null
            : null;

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:upload-success', {
            detail: { file, response, uploadId },
        }));
    }

    #onUploadError(file, error) {
        const li = this.#fileItemMap.get(file.id);
        if (li) {
            const badge = li.querySelector('.cu-file-status');
            if (badge) {
                badge.className = 'cu-file-status badge bg-danger';
                badge.textContent = 'Error';
            }
        }

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:upload-error', {
            detail: { file, error },
        }));
    }

    #onComplete(result) {
        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:complete', {
            detail: result,
        }));
    }

    #onRestrictionFailed(file, error) {
        this.#showError(error.message);
    }

    #addFiles(files) {
        Array.from(files).forEach((file) => {
            try {
                this.#uppy.addFile({ name: file.name, type: file.type, data: file, size: file.size });
            } catch { /* restriction-failed event se dispara via Uppy */ }
        });
    }

    #reset() {
        this.#uppy.cancelAll();
        this.#fileItemMap.clear();
        this.#fileListEl.innerHTML = '';
        this.#fileListEl.classList.add('d-none');
        this.#actionsEl.classList.add('d-none');
        this.#clearError();
    }

    #showError(message) {
        if (this.#errorAlertEl) {
            this.#errorAlertEl.textContent = message;
            this.#errorAlertEl.classList.remove('d-none');
        }
    }

    #clearError() {
        if (this.#errorAlertEl) {
            this.#errorAlertEl.textContent = '';
            this.#errorAlertEl.classList.add('d-none');
        }
    }

    #formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    #destroy() {
        this.root.querySelector('.cu-browse-btn')?.removeEventListener('click', this.#onBrowseClick);
        this.#fileInputEl?.removeEventListener('change', this.#onFileInputChange);
        this.#dropzoneEl?.removeEventListener('dragover', this.#onDragOver);
        this.#dropzoneEl?.removeEventListener('dragleave', this.#onDragLeave);
        this.#dropzoneEl?.removeEventListener('drop', this.#onDrop);
        this.root.querySelector('.cu-upload-btn')?.removeEventListener('click', this.#onUploadBtnClick);
        this.root.querySelector('.cu-cancel-btn')?.removeEventListener('click', this.#onCancelBtnClick);

        this.#uppy?.destroy();
        this.#fileItemMap.clear();
        delete this.root.chunkedUpload;
    }
}
