import Component from '../Component';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import './_chunked-upload.scss';

const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;
const DEFAULT_RETRY_DELAYS = [0, 1000, 3000, 5000];
const DEFAULT_AUTO_RESET_DELAY_MS = 3000;

const DEFAULT_SETTINGS = {
    chunkSize: DEFAULT_CHUNK_SIZE,
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    maxNumberOfFiles: 1,
    retryDelays: DEFAULT_RETRY_DELAYS,
    parallelUploads: 1,
    autoProceed: false,
    autoResetDelay: DEFAULT_AUTO_RESET_DELAY_MS,
    allowedFileTypes: null,
    labels: {},
};

export default class ChunkedUpload extends Component {
    #uppy = null;
    #fileInputEl = null;
    #dropzoneEl = null;
    #overlayEl = null;
    #fileListEl = null;
    #actionsEl = null;
    #errorAlertEl = null;
    #uploadBtnEl = null;
    #cancelBtnEl = null;
    #fileItemMap = new Map();
    #autoResetTimer = null;
    #isUploading = false;
    #progressRaf = null;
    #latestProgressDetail = null;

    #onDropzoneClick = (e) => {
        if (this.#isUploading) return;
        if (e.target === this.#fileInputEl) return;
        this.#fileInputEl?.click();
    };

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
        if (this.#isUploading) return;
        this.#dropzoneEl?.classList.add('is-dragging');
    };

    #onDragLeave = () => this.#dropzoneEl?.classList.remove('is-dragging');

    #onDrop = (e) => {
        e.preventDefault();
        this.#dropzoneEl?.classList.remove('is-dragging');
        if (this.#isUploading) return;
        if (e.dataTransfer?.files?.length) {
            Array.from(e.dataTransfer.files).forEach((file) => {
                try {
                    this.#uppy.addFile({ name: file.name, type: file.type, data: file, size: file.size });
                } catch { /* restriction-failed event se dispara via Uppy */ }
            });
        }
    };

    #onDropzoneKeyDown = (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (this.#isUploading) return;
        this.#fileInputEl?.click();
    };

    #onUploadBtnClick = () => this.#uppy.upload();

    #onCancelBtnClick = () => {
        this.#reset(true);
    };

    constructor(element) {
        super(element);
        try {
            this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(element.dataset.settings || '{}') };
        } catch {
            this.settings = { ...DEFAULT_SETTINGS };
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
            cancelAll: () => { this.#reset(true); return this.root.chunkedUpload; },
            reset: () => { this.#reset(); return this.root.chunkedUpload; },
            openFilePicker: () => { this.#fileInputEl?.click(); return this.root.chunkedUpload; },
            addFiles: (files) => { this.#addFiles(files); return this.root.chunkedUpload; },
            destroy: () => this.#destroy(),
        };

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:initialized', { bubbles: true }));
    }

    #buildUI() {
        const settings = this.settings;

        this.#fileInputEl = document.createElement('input');
        this.#fileInputEl.type = 'file';
        this.#fileInputEl.className = 'cu-file-input visually-hidden';
        if (settings.maxNumberOfFiles !== 1) {
            this.#fileInputEl.multiple = true;
        }
        if (settings.allowedFileTypes?.length) {
            this.#fileInputEl.accept = settings.allowedFileTypes.join(',');
        }

        const iconEl = document.createElement('i');
        iconEl.className = `bi ${settings.labels.icon || 'bi-cloud-upload'} fs-1 cu-dropzone-icon d-block mb-2`;

        const dropzoneLabelEl = document.createElement('p');
        dropzoneLabelEl.className = 'cu-dropzone-label fw-semibold mb-1';
        dropzoneLabelEl.textContent = settings.labels.dropzone || 'Arrastra el fichero aquí';

        const contentEl = document.createElement('div');
        contentEl.className = 'cu-dropzone-content text-center py-4';
        contentEl.append(iconEl, dropzoneLabelEl);

        if (settings.labels.dropzoneSubtitle) {
            const subtitleEl = document.createElement('p');
            subtitleEl.className = 'cu-dropzone-subtitle text-muted small mb-0';
            subtitleEl.textContent = settings.labels.dropzoneSubtitle;
            contentEl.appendChild(subtitleEl);
        }

        const spinnerLabelEl = document.createElement('span');
        spinnerLabelEl.className = 'visually-hidden';
        spinnerLabelEl.textContent = settings.labels.uploading || 'Subiendo…';

        const spinnerEl = document.createElement('div');
        spinnerEl.className = 'spinner-border';
        spinnerEl.setAttribute('role', 'status');
        spinnerEl.appendChild(spinnerLabelEl);

        this.#overlayEl = document.createElement('div');
        this.#overlayEl.className = 'cu-dropzone-overlay d-none';
        this.#overlayEl.appendChild(spinnerEl);

        this.#dropzoneEl = document.createElement('div');
        this.#dropzoneEl.className = 'cu-dropzone border border-2 rounded-3 mb-3 d-flex flex-column align-items-center justify-content-center';
        this.#dropzoneEl.setAttribute('role', 'button');
        this.#dropzoneEl.setAttribute('tabindex', '0');
        this.#dropzoneEl.append(this.#fileInputEl, contentEl, this.#overlayEl);

        this.#fileListEl = document.createElement('ul');
        this.#fileListEl.className = 'cu-file-list list-unstyled mb-3 d-none';

        const uploadBtnIcon = document.createElement('i');
        uploadBtnIcon.className = 'bi bi-upload me-1';

        this.#uploadBtnEl = document.createElement('button');
        this.#uploadBtnEl.type = 'button';
        this.#uploadBtnEl.className = 'btn btn-primary btn-sm cu-upload-btn';
        this.#uploadBtnEl.append(uploadBtnIcon, settings.labels.uploadFileButton || 'Subir');

        if (settings.autoProceed) {
            this.#uploadBtnEl.classList.add('d-none');
        }

        this.#cancelBtnEl = document.createElement('button');
        this.#cancelBtnEl.type = 'button';
        this.#cancelBtnEl.className = 'btn btn-outline-secondary btn-sm cu-cancel-btn';
        this.#cancelBtnEl.textContent = settings.labels.cancelButton || 'Cancelar';

        this.#actionsEl = document.createElement('div');
        this.#actionsEl.className = 'cu-actions d-flex gap-2 d-none';
        this.#actionsEl.append(this.#uploadBtnEl, this.#cancelBtnEl);

        this.#errorAlertEl = document.createElement('div');
        this.#errorAlertEl.className = 'alert alert-danger cu-error-alert d-none mt-2';
        this.#errorAlertEl.setAttribute('role', 'alert');

        const wrapper = document.createElement('div');
        wrapper.className = 'chunked-upload';
        wrapper.append(this.#dropzoneEl, this.#fileListEl, this.#actionsEl, this.#errorAlertEl);

        this.root.appendChild(wrapper);
    }

    #initUppy() {
        const settings = this.settings;

        this.#uppy = new Uppy({
            restrictions: {
                maxFileSize: settings.maxFileSize,
                allowedFileTypes: settings.allowedFileTypes,
                maxNumberOfFiles: settings.maxNumberOfFiles,
            },
            autoProceed: settings.autoProceed,
        }).use(Tus, {
            endpoint: settings.endpoint,
            chunkSize: settings.chunkSize,
            retryDelays: settings.retryDelays,
            limit: settings.parallelUploads,
        });

        this.#uppy
            .on('file-added', (file) => this.#onFileAdded(file))
            .on('upload', () => this.#setUploading(true))
            .on('upload-progress', (file, progress) => this.#onUploadProgress(file, progress))
            .on('upload-success', (file, response) => this.#onUploadSuccess(file, response))
            .on('upload-error', (file, error) => this.#onUploadError(file, error))
            .on('complete', (result) => this.#onComplete(result))
            .on('restriction-failed', (file, error) => this.#onRestrictionFailed(file, error));
    }

    #attachDOMListeners() {
        this.#dropzoneEl?.addEventListener('click', this.#onDropzoneClick);
        this.#dropzoneEl?.addEventListener('keydown', this.#onDropzoneKeyDown);
        this.#fileInputEl?.addEventListener('change', this.#onFileInputChange);
        this.#dropzoneEl?.addEventListener('dragover', this.#onDragOver);
        this.#dropzoneEl?.addEventListener('dragleave', this.#onDragLeave);
        this.#dropzoneEl?.addEventListener('drop', this.#onDrop);
        this.#uploadBtnEl?.addEventListener('click', this.#onUploadBtnClick);
        this.#cancelBtnEl?.addEventListener('click', this.#onCancelBtnClick);
    }

    #onFileAdded(file) {
        this.#clearError();

        const li = document.createElement('li');
        li.className = 'cu-file-item d-flex align-items-center gap-2 mb-2';
        li.dataset.fileId = file.id;

        const icon = document.createElement('i');
        icon.className = 'bi bi-file-earmark text-muted';

        const nameEl = document.createElement('span');
        nameEl.className = 'cu-file-name text-truncate flex-grow-1 small';
        nameEl.textContent = file.name;

        const sizeEl = document.createElement('span');
        sizeEl.className = 'cu-file-size text-muted small';
        sizeEl.textContent = this.#formatBytes(file.size);

        const progressBarEl = document.createElement('div');
        progressBarEl.className = 'progress-bar cu-progress-bar';
        progressBarEl.setAttribute('role', 'progressbar');
        progressBarEl.style.width = '0%';

        const progressEl = document.createElement('div');
        progressEl.className = 'progress flex-grow-1 d-none';
        progressEl.style.height = '6px';
        progressEl.appendChild(progressBarEl);

        const statusEl = document.createElement('span');
        statusEl.className = 'cu-file-status badge bg-secondary';
        statusEl.textContent = this.settings.labels.statusQueued || 'En cola';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-close btn-sm cu-file-remove';
        removeBtn.setAttribute('aria-label', 'Eliminar');

        li.append(icon, nameEl, sizeEl, progressEl, statusEl, removeBtn);

        removeBtn.addEventListener('click', () => {
            if (this.#isUploading) return;
            this.#uppy.removeFile(file.id);
            li.remove();
            this.#fileItemMap.delete(file.id);
            if (this.#fileItemMap.size === 0) {
                this.#fileListEl.classList.add('d-none');
                this.#actionsEl.classList.add('d-none');
            }
        });

        this.#fileListEl.appendChild(li);
        this.#fileItemMap.set(file.id, { li, progressEl, progressBarEl, statusEl });
        this.#fileListEl.classList.remove('d-none');
        if (!this.settings.autoProceed) {
            this.#actionsEl.classList.remove('d-none');
        }

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:file-added', { bubbles: true, detail: { file } }));
    }

    #onUploadProgress(file, progress) {
        const fileEntry = this.#fileItemMap.get(file.id);
        if (fileEntry) {
            fileEntry.progressEl.classList.remove('d-none');
            const pct = progress.bytesTotal
                ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
                : 0;
            fileEntry.progressBarEl.style.width = `${pct}%`;
            fileEntry.statusEl.className = 'cu-file-status badge bg-primary';
            fileEntry.statusEl.textContent = this.settings.labels.statusUploading || 'Subiendo…';
        }

        this.#latestProgressDetail = { file, progress };
        if (!this.#progressRaf) {
            this.#progressRaf = requestAnimationFrame(() => {
                this.#progressRaf = null;
                this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:progress', {
                    bubbles: true,
                    detail: this.#latestProgressDetail,
                }));
            });
        }
    }

    #onUploadSuccess(file, response) {
        const fileEntry = this.#fileItemMap.get(file.id);
        if (fileEntry) {
            fileEntry.progressBarEl.style.width = '100%';
            fileEntry.statusEl.className = 'cu-file-status badge bg-success';
            fileEntry.statusEl.textContent = this.settings.labels.statusCompleted || 'Completado';
        }

        const uploadURL = response?.uploadURL;
        let uploadId = null;
        if (uploadURL) {
            try {
                uploadId = new URL(uploadURL, location.href).pathname.split('/').filter(Boolean).pop() ?? null;
            } catch { /* uploadId remains null if the URL cannot be parsed */ }
        }

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:upload-success', {
            bubbles: true,
            detail: { file, response, uploadId },
        }));
    }

    #onUploadError(file, error) {
        const fileEntry = this.#fileItemMap.get(file.id);
        if (fileEntry) {
            fileEntry.statusEl.className = 'cu-file-status badge bg-danger';
            fileEntry.statusEl.textContent = this.settings.labels.statusError || 'Error';
        }

        this.#setUploading(false);

        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:upload-error', {
            bubbles: true,
            detail: { file, error },
        }));
    }

    #onComplete(result) {
        this.#setUploading(false);
        this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:complete', {
            bubbles: true,
            detail: result,
        }));

        if (this.settings.autoProceed && result.failed.length === 0 && result.successful.length > 0) {
            this.#autoResetTimer = setTimeout(() => {
                this.#autoResetTimer = null;
                this.#reset();
            }, this.settings.autoResetDelay);
        }
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

    #clearAutoResetTimer() {
        if (this.#autoResetTimer) {
            clearTimeout(this.#autoResetTimer);
            this.#autoResetTimer = null;
        }
    }

    #setUploading(active) {
        this.#isUploading = active;
        this.#dropzoneEl?.classList.toggle('is-uploading', active);
        this.#overlayEl?.classList.toggle('d-none', !active);
    }

    #reset(emitCancelEvent = false) {
        this.#clearAutoResetTimer();
        this.#setUploading(false);
        this.#uppy.cancelAll();
        this.#fileItemMap.clear();
        this.#fileListEl.innerHTML = '';
        this.#fileListEl.classList.add('d-none');
        this.#actionsEl.classList.add('d-none');
        this.#clearError();
        if (emitCancelEvent) {
            this.root.dispatchEvent(new CustomEvent('emg-jsc:chunkedUpload:cancel-all', { bubbles: true }));
        }
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
        if (bytes == null || isNaN(bytes)) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    #destroy() {
        this.#clearAutoResetTimer();
        if (this.#progressRaf) {
            cancelAnimationFrame(this.#progressRaf);
            this.#progressRaf = null;
        }
        this.#dropzoneEl?.removeEventListener('click', this.#onDropzoneClick);
        this.#dropzoneEl?.removeEventListener('keydown', this.#onDropzoneKeyDown);
        this.#fileInputEl?.removeEventListener('change', this.#onFileInputChange);
        this.#dropzoneEl?.removeEventListener('dragover', this.#onDragOver);
        this.#dropzoneEl?.removeEventListener('dragleave', this.#onDragLeave);
        this.#dropzoneEl?.removeEventListener('drop', this.#onDrop);
        this.#uploadBtnEl?.removeEventListener('click', this.#onUploadBtnClick);
        this.#cancelBtnEl?.removeEventListener('click', this.#onCancelBtnClick);

        this.#uppy?.destroy();
        this.#fileItemMap.clear();
        delete this.root.chunkedUpload;
    }
}
