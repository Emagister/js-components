import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@uppy/core', () => ({ default: vi.fn() }));
vi.mock('@uppy/tus', () => ({ default: vi.fn() }));
vi.mock('../../../src/components/ChunkedUpload/_chunked-upload.scss', () => ({}));

import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import ChunkedUpload from '../../../src/components/ChunkedUpload/ChunkedUpload.js';

function createElement(settings = {}) {
    const el = document.createElement('div');
    if (Object.keys(settings).length > 0) {
        el.dataset.settings = JSON.stringify(settings);
    }
    document.body.appendChild(el);
    return el;
}

describe('ChunkedUpload', () => {
    let element;
    let uppyInstance;
    let component;

    beforeEach(() => {
        uppyInstance = {
            _callbacks: {},
            use: vi.fn().mockReturnThis(),
            on: vi.fn(function (event, cb) {
                uppyInstance._callbacks[event] ??= [];
                uppyInstance._callbacks[event].push(cb);
                return this;
            }),
            _emit: (event, ...args) => {
                (uppyInstance._callbacks[event] || []).forEach((cb) => cb(...args));
            },
            upload: vi.fn(() => Promise.resolve({ successful: [], failed: [] })),
            cancelAll: vi.fn(),
            addFile: vi.fn(),
            removeFile: vi.fn(),
            destroy: vi.fn(),
        };

        Uppy.mockImplementation(function () {
            return uppyInstance;
        });

        element = createElement({ endpoint: '/files/' });
        component = new ChunkedUpload(element);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    // ─── constructor ──────────────────────────────────────────────────────────

    describe('constructor', () => {
        it('lee el endpoint desde data-settings', () => {
            expect(component.settings.endpoint).toBe('/files/');
        });

        it('aplica chunkSize por defecto de 50 MB', () => {
            expect(component.settings.chunkSize).toBe(50 * 1024 * 1024);
        });

        it('aplica maxFileSize por defecto de 500 MB', () => {
            expect(component.settings.maxFileSize).toBe(500 * 1024 * 1024);
        });

        it('aplica retryDelays por defecto', () => {
            expect(component.settings.retryDelays).toEqual([0, 1000, 3000, 5000]);
        });

        it('aplica parallelUploads por defecto de 1', () => {
            expect(component.settings.parallelUploads).toBe(1);
        });

        it('aplica autoProceed por defecto false', () => {
            expect(component.settings.autoProceed).toBe(false);
        });

        it('lee configuración personalizada desde data-settings', () => {
            const el = createElement({
                endpoint: '/upload/',
                chunkSize: 10 * 1024 * 1024,
                maxFileSize: 100 * 1024 * 1024,
                parallelUploads: 3,
            });
            const c = new ChunkedUpload(el);
            expect(c.settings.endpoint).toBe('/upload/');
            expect(c.settings.chunkSize).toBe(10 * 1024 * 1024);
            expect(c.settings.maxFileSize).toBe(100 * 1024 * 1024);
            expect(c.settings.parallelUploads).toBe(3);
        });

        it('JSON inválido en data-settings usa defaults sin lanzar error', () => {
            const el = document.createElement('div');
            el.dataset.settings = '{invalid json}';
            document.body.appendChild(el);
            expect(() => new ChunkedUpload(el)).not.toThrow();
        });
    });

    // ─── init() ───────────────────────────────────────────────────────────────

    describe('init()', () => {
        it('lanza error si no hay endpoint configurado', () => {
            const el = createElement({});
            const c = new ChunkedUpload(el);
            expect(() => c.init()).toThrow('ChunkedUpload');
        });

        it('renderiza .cu-dropzone dentro del root', () => {
            component.init();
            expect(element.querySelector('.cu-dropzone')).not.toBeNull();
        });

        it('renderiza input[type=file].cu-file-input dentro del dropzone', () => {
            component.init();
            const input = element.querySelector('input.cu-file-input');
            expect(input).not.toBeNull();
            expect(input.type).toBe('file');
        });

        it('renderiza .cu-file-list oculta inicialmente', () => {
            component.init();
            const list = element.querySelector('.cu-file-list');
            expect(list).not.toBeNull();
            expect(list.classList.contains('d-none')).toBe(true);
        });

        it('renderiza .cu-actions oculta inicialmente', () => {
            component.init();
            const actions = element.querySelector('.cu-actions');
            expect(actions).not.toBeNull();
            expect(actions.classList.contains('d-none')).toBe(true);
        });

        it('renderiza .cu-error-alert oculta inicialmente', () => {
            component.init();
            const alert = element.querySelector('.cu-error-alert');
            expect(alert).not.toBeNull();
            expect(alert.classList.contains('d-none')).toBe(true);
        });

        it('instancia Uppy con las restrictions correctas', () => {
            const el = createElement({
                endpoint: '/files/',
                maxFileSize: 100 * 1024 * 1024,
                allowedFileTypes: ['image/*'],
            });
            const c = new ChunkedUpload(el);
            c.init();
            expect(Uppy).toHaveBeenCalledWith(
                expect.objectContaining({
                    restrictions: expect.objectContaining({
                        maxFileSize: 100 * 1024 * 1024,
                        allowedFileTypes: ['image/*'],
                    }),
                })
            );
        });

        it('llama a .use(Tus) con endpoint y chunkSize correctos', () => {
            component.init();
            expect(uppyInstance.use).toHaveBeenCalledWith(
                Tus,
                expect.objectContaining({
                    endpoint: '/files/',
                    chunkSize: 50 * 1024 * 1024,
                })
            );
        });

        it('llama a .use(Tus) con retryDelays y limit correctos', () => {
            component.init();
            expect(uppyInstance.use).toHaveBeenCalledWith(
                Tus,
                expect.objectContaining({
                    retryDelays: [0, 1000, 3000, 5000],
                    limit: 1,
                })
            );
        });

        it('registra listeners para los eventos de Uppy', () => {
            component.init();
            const registeredEvents = uppyInstance.on.mock.calls.map((c) => c[0]);
            expect(registeredEvents).toContain('file-added');
            expect(registeredEvents).toContain('upload-progress');
            expect(registeredEvents).toContain('upload-success');
            expect(registeredEvents).toContain('upload-error');
            expect(registeredEvents).toContain('complete');
            expect(registeredEvents).toContain('restriction-failed');
        });

        it('expone la API pública en root.chunkedUpload', () => {
            component.init();
            expect(typeof element.chunkedUpload.upload).toBe('function');
            expect(typeof element.chunkedUpload.cancelAll).toBe('function');
            expect(typeof element.chunkedUpload.reset).toBe('function');
            expect(typeof element.chunkedUpload.openFilePicker).toBe('function');
            expect(typeof element.chunkedUpload.addFiles).toBe('function');
            expect(typeof element.chunkedUpload.destroy).toBe('function');
        });

        it('despacha emg-jsc:chunkedUpload:initialized', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:chunkedUpload:initialized', handler);
            component.init();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('los eventos del componente burbujean hacia elementos ancestros', () => {
            const handler = vi.fn();
            document.body.addEventListener('emg-jsc:chunkedUpload:initialized', handler);
            component.init();
            expect(handler).toHaveBeenCalledOnce();
            document.body.removeEventListener('emg-jsc:chunkedUpload:initialized', handler);
        });

        it('oculta cu-upload-btn cuando autoProceed es true', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true });
            const c = new ChunkedUpload(el);
            c.init();
            const btn = el.querySelector('.cu-upload-btn');
            expect(btn.classList.contains('d-none')).toBe(true);
        });

        it('usa el icono por defecto bi-cloud-upload cuando no se configura labels.icon', () => {
            component.init();
            const icon = element.querySelector('.cu-dropzone i');
            expect(icon.classList.contains('bi-cloud-upload')).toBe(true);
        });

        it('usa labels.icon como clase del icono cuando se configura', () => {
            const el = createElement({ endpoint: '/files/', labels: { icon: 'bi-file-earmark-arrow-up' } });
            const c = new ChunkedUpload(el);
            c.init();
            const icon = el.querySelector('.cu-dropzone i');
            expect(icon.classList.contains('bi-file-earmark-arrow-up')).toBe(true);
            expect(icon.classList.contains('bi-cloud-upload')).toBe(false);
        });

        it('el icono tiene la clase cu-dropzone-icon', () => {
            component.init();
            const icon = element.querySelector('.cu-dropzone .cu-dropzone-icon');
            expect(icon).not.toBeNull();
        });

        it('renderiza .cu-dropzone-label con clase fw-semibold', () => {
            component.init();
            const label = element.querySelector('.cu-dropzone-label');
            expect(label).not.toBeNull();
            expect(label.classList.contains('fw-semibold')).toBe(true);
        });

        it('no renderiza .cu-dropzone-subtitle cuando no se configura labels.dropzoneSubtitle', () => {
            component.init();
            expect(element.querySelector('.cu-dropzone-subtitle')).toBeNull();
        });

        it('renderiza .cu-dropzone-subtitle cuando se configura labels.dropzoneSubtitle', () => {
            const el = createElement({ endpoint: '/files/', labels: { dropzoneSubtitle: 'Máximo 500 MB' } });
            const c = new ChunkedUpload(el);
            c.init();
            const subtitle = el.querySelector('.cu-dropzone-subtitle');
            expect(subtitle).not.toBeNull();
            expect(subtitle.textContent).toBe('Máximo 500 MB');
        });

        it('no renderiza .cu-browse-btn dentro del dropzone', () => {
            component.init();
            expect(element.querySelector('.cu-browse-btn')).toBeNull();
        });

        it('usa el texto por defecto en cu-upload-btn cuando no se configura labels.uploadFileButton', () => {
            component.init();
            expect(element.querySelector('.cu-upload-btn').textContent.trim()).toBe('Subir');
        });

        it('usa labels.uploadFileButton como texto del botón de subida', () => {
            const el = createElement({ endpoint: '/files/', labels: { uploadFileButton: 'Enviar al servidor' } });
            const c = new ChunkedUpload(el);
            c.init();
            expect(el.querySelector('.cu-upload-btn').textContent.trim()).toBe('Enviar al servidor');
        });

        it('usa el texto por defecto en cu-cancel-btn cuando no se configura labels.cancelButton', () => {
            component.init();
            expect(element.querySelector('.cu-cancel-btn').textContent.trim()).toBe('Cancelar');
        });

        it('usa labels.cancelButton como texto del botón de cancelación', () => {
            const el = createElement({ endpoint: '/files/', labels: { cancelButton: 'Detener' } });
            const c = new ChunkedUpload(el);
            c.init();
            expect(el.querySelector('.cu-cancel-btn').textContent.trim()).toBe('Detener');
        });
    });

    // ─── Interacción UI ───────────────────────────────────────────────────────

    describe('Interacción UI', () => {
        beforeEach(() => component.init());

        it('click en cu-dropzone hace click en el file input', () => {
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            element.querySelector('.cu-dropzone').click();
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        it('change en file input llama a uppy.addFile() por cada fichero', () => {
            const input = element.querySelector('.cu-file-input');
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(input, 'files', { value: [file], configurable: true });
            input.dispatchEvent(new Event('change'));
            expect(uppyInstance.addFile).toHaveBeenCalledOnce();
            expect(uppyInstance.addFile).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'test.txt', type: 'text/plain' })
            );
        });

        it('dragover sobre dropzone añade clase is-dragging', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            dropzone.dispatchEvent(new DragEvent('dragover', { bubbles: true }));
            expect(dropzone.classList.contains('is-dragging')).toBe(true);
        });

        it('dragleave sobre dropzone quita clase is-dragging', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            dropzone.classList.add('is-dragging');
            dropzone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
            expect(dropzone.classList.contains('is-dragging')).toBe(false);
        });

        it('drop con ficheros llama a uppy.addFile() y quita is-dragging', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            dropzone.classList.add('is-dragging');
            const file = new File(['content'], 'dropped.txt', { type: 'text/plain' });
            const dt = { files: [file] };
            const event = new DragEvent('drop', { bubbles: true });
            Object.defineProperty(event, 'dataTransfer', { value: dt });
            dropzone.dispatchEvent(event);
            expect(uppyInstance.addFile).toHaveBeenCalledOnce();
            expect(dropzone.classList.contains('is-dragging')).toBe(false);
        });
    });

    // ─── Accesibilidad del dropzone ───────────────────────────────────────────

    describe('accesibilidad del dropzone', () => {
        beforeEach(() => component.init());

        it('el dropzone tiene role="button"', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.getAttribute('role')).toBe('button');
        });

        it('el dropzone tiene tabindex="0"', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.getAttribute('tabindex')).toBe('0');
        });

        it('Enter sobre el dropzone abre el selector de fichero', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            dropzone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        it('Espacio sobre el dropzone abre el selector de fichero', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            dropzone.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        it('otras teclas no abren el selector de fichero', () => {
            const dropzone = element.querySelector('.cu-dropzone');
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            dropzone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
            expect(clickSpy).not.toHaveBeenCalled();
        });

        it('Enter no abre el selector si el componente está subiendo', () => {
            uppyInstance._emit('upload');
            const dropzone = element.querySelector('.cu-dropzone');
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            dropzone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            expect(clickSpy).not.toHaveBeenCalled();
        });
    });

    // ─── Eventos Uppy → DOM ───────────────────────────────────────────────────

    describe('Eventos Uppy → DOM', () => {
        beforeEach(() => component.init());

        const fakeFile = (overrides = {}) => ({
            id: 'uppy-test-id',
            name: 'video.mp4',
            size: 50 * 1024 * 1024,
            type: 'video/mp4',
            ...overrides,
        });

        describe('file-added', () => {
            it('crea un <li> en cu-file-list con el nombre del fichero', () => {
                uppyInstance._emit('file-added', fakeFile());
                const li = element.querySelector('[data-file-id="uppy-test-id"]');
                expect(li).not.toBeNull();
                expect(li.querySelector('.cu-file-name').textContent).toBe('video.mp4');
            });

            it('muestra el badge con texto "En cola" por defecto', () => {
                uppyInstance._emit('file-added', fakeFile());
                const badge = element.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('En cola');
            });

            it('usa labels.statusQueued como texto del badge inicial', () => {
                const el = createElement({ endpoint: '/files/', labels: { statusQueued: 'Pendiente' } });
                const c = new ChunkedUpload(el);
                c.init();
                uppyInstance._emit('file-added', fakeFile());
                const badge = el.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Pendiente');
            });

            it('click en el botón de eliminar mientras se sube no llama a uppy.removeFile', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload');
                const removeBtn = element.querySelector('.cu-file-remove');
                removeBtn.click();
                expect(uppyInstance.removeFile).not.toHaveBeenCalled();
            });

            it('hace visible cu-file-list y cu-actions', () => {
                uppyInstance._emit('file-added', fakeFile());
                expect(element.querySelector('.cu-file-list').classList.contains('d-none')).toBe(false);
                expect(element.querySelector('.cu-actions').classList.contains('d-none')).toBe(false);
            });

            it('no muestra cu-actions cuando autoProceed es true', () => {
                const el = createElement({ endpoint: '/files/', autoProceed: true });
                const c = new ChunkedUpload(el);
                c.init();
                uppyInstance._emit('file-added', fakeFile());
                expect(el.querySelector('.cu-actions').classList.contains('d-none')).toBe(true);
            });

            it('despacha emg-jsc:chunkedUpload:file-added con el fichero', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:file-added', handler);
                const file = fakeFile();
                uppyInstance._emit('file-added', file);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail.file).toBe(file);
            });
        });

        describe('upload-progress', () => {
            it('muestra la barra de progreso del fichero', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { bytesUploaded: 20 * 1024 * 1024, bytesTotal: 50 * 1024 * 1024 });
                const li = element.querySelector('[data-file-id="uppy-test-id"]');
                const progress = li.querySelector('.progress');
                expect(progress.classList.contains('d-none')).toBe(false);
            });

            it('actualiza el ancho del progress-bar calculando el porcentaje desde bytesUploaded/bytesTotal', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { bytesUploaded: 325 * 1024 * 1024, bytesTotal: 500 * 1024 * 1024 });
                const li = element.querySelector('[data-file-id="uppy-test-id"]');
                expect(li.querySelector('.cu-progress-bar').style.width).toBe('65%');
            });

            it('actualiza el badge a "Subiendo…" con clase bg-primary', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { bytesUploaded: 15 * 1024 * 1024, bytesTotal: 50 * 1024 * 1024 });
                const badge = element.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Subiendo…');
                expect(badge.classList.contains('bg-primary')).toBe(true);
            });

            it('usa labels.statusUploading como texto del badge durante la subida', () => {
                const el = createElement({ endpoint: '/files/', labels: { statusUploading: 'Enviando…' } });
                const c = new ChunkedUpload(el);
                c.init();
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { bytesUploaded: 25 * 1024 * 1024, bytesTotal: 50 * 1024 * 1024 });
                const badge = el.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Enviando…');
            });

            it('muestra 0% si bytesTotal es 0', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { bytesUploaded: 0, bytesTotal: 0 });
                const li = element.querySelector('[data-file-id="uppy-test-id"]');
                expect(li.querySelector('.cu-progress-bar').style.width).toBe('0%');
            });

            it('despacha emg-jsc:chunkedUpload:progress con el detail correcto', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:progress', handler);
                const file = fakeFile();
                const progress = { bytesUploaded: 25 * 1024 * 1024, bytesTotal: 50 * 1024 * 1024 };
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-progress', file, progress);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ file, progress });
            });
        });

        describe('upload-success', () => {
            it('actualiza el badge a "Completado" con clase bg-success', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc123' });
                const badge = element.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Completado');
                expect(badge.classList.contains('bg-success')).toBe(true);
            });

            it('usa labels.statusCompleted como texto del badge en éxito', () => {
                const el = createElement({ endpoint: '/files/', labels: { statusCompleted: 'Listo' } });
                const c = new ChunkedUpload(el);
                c.init();
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc123' });
                const badge = el.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Listo');
            });

            it('despacha emg-jsc:chunkedUpload:upload-success con file, response y uploadId', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:upload-success', handler);
                const file = fakeFile();
                const response = { uploadURL: 'https://example.com/files/abc123' };
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-success', file, response);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ file, response, uploadId: 'abc123' });
            });

            it('incluye uploadId null si la response no tiene uploadURL', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:upload-success', handler);
                const file = fakeFile();
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-success', file, {});
                expect(handler.mock.calls[0][0].detail.uploadId).toBeNull();
            });

            it('extrae uploadId de una uploadURL relativa sin lanzar excepción', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:upload-success', handler);
                const file = fakeFile();
                const response = { uploadURL: '/files/abc123' };
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-success', file, response);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail.uploadId).toBe('abc123');
            });

            it('despacha el evento aunque uploadURL no se pueda parsear', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:upload-success', handler);
                const file = fakeFile();
                uppyInstance._emit('file-added', file);
                expect(() => {
                    uppyInstance._emit('upload-success', file, { uploadURL: 'not a url at all  ' });
                }).not.toThrow();
                expect(handler).toHaveBeenCalledOnce();
            });
        });

        describe('upload-error', () => {
            it('actualiza el badge a "Error" con clase bg-danger', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-error', fakeFile(), new Error('Network error'));
                const badge = element.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Error');
                expect(badge.classList.contains('bg-danger')).toBe(true);
            });

            it('usa labels.statusError como texto del badge en error', () => {
                const el = createElement({ endpoint: '/files/', labels: { statusError: 'Fallido' } });
                const c = new ChunkedUpload(el);
                c.init();
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-error', fakeFile(), new Error('Network error'));
                const badge = el.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Fallido');
            });

            it('despacha emg-jsc:chunkedUpload:upload-error', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:upload-error', handler);
                const file = fakeFile();
                const error = new Error('Network error');
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-error', file, error);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ file, error });
            });
        });

        describe('complete', () => {
            it('despacha emg-jsc:chunkedUpload:complete con el resultado', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:complete', handler);
                const result = { successful: [fakeFile()], failed: [] };
                uppyInstance._emit('complete', result);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual(result);
            });
        });

        describe('restriction-failed', () => {
            it('muestra el mensaje de error en cu-error-alert', () => {
                uppyInstance._emit('restriction-failed', null, new Error('File too large'));
                const alert = element.querySelector('.cu-error-alert');
                expect(alert.classList.contains('d-none')).toBe(false);
                expect(alert.textContent).toBe('File too large');
            });
        });
    });

    // ─── API pública ──────────────────────────────────────────────────────────

    describe('API pública', () => {
        beforeEach(() => component.init());

        it('upload() llama a uppy.upload()', () => {
            element.chunkedUpload.upload();
            expect(uppyInstance.upload).toHaveBeenCalledOnce();
        });

        it('upload() retorna root.chunkedUpload para encadenamiento', () => {
            expect(element.chunkedUpload.upload()).toBe(element.chunkedUpload);
        });

        it('cancelAll() llama a uppy.cancelAll()', () => {
            element.chunkedUpload.cancelAll();
            expect(uppyInstance.cancelAll).toHaveBeenCalledOnce();
        });

        it('cancelAll() retorna root.chunkedUpload para encadenamiento', () => {
            expect(element.chunkedUpload.cancelAll()).toBe(element.chunkedUpload);
        });

        it('openFilePicker() hace click en el file input', () => {
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            element.chunkedUpload.openFilePicker();
            expect(clickSpy).toHaveBeenCalledOnce();
        });

        it('openFilePicker() retorna root.chunkedUpload para encadenamiento', () => {
            expect(element.chunkedUpload.openFilePicker()).toBe(element.chunkedUpload);
        });

        it('addFiles() llama a uppy.addFile() por cada fichero', () => {
            const files = [
                new File(['a'], 'a.txt', { type: 'text/plain' }),
                new File(['b'], 'b.txt', { type: 'text/plain' }),
            ];
            element.chunkedUpload.addFiles(files);
            expect(uppyInstance.addFile).toHaveBeenCalledTimes(2);
        });

        it('addFiles() retorna root.chunkedUpload para encadenamiento', () => {
            expect(element.chunkedUpload.addFiles([])).toBe(element.chunkedUpload);
        });

        describe('reset()', () => {
            it('llama a uppy.cancelAll()', () => {
                element.chunkedUpload.reset();
                expect(uppyInstance.cancelAll).toHaveBeenCalledOnce();
            });

            it('oculta cu-file-list y cu-actions', () => {
                uppyInstance._emit('file-added', {
                    id: 'f1',
                    name: 'test.mp4',
                    size: 1024,
                    type: 'video/mp4',
                });
                element.chunkedUpload.reset();
                expect(element.querySelector('.cu-file-list').classList.contains('d-none')).toBe(true);
                expect(element.querySelector('.cu-actions').classList.contains('d-none')).toBe(true);
            });

            it('limpia la lista de ficheros del DOM', () => {
                uppyInstance._emit('file-added', {
                    id: 'f1',
                    name: 'test.mp4',
                    size: 1024,
                    type: 'video/mp4',
                });
                element.chunkedUpload.reset();
                expect(element.querySelector('.cu-file-list').children).toHaveLength(0);
            });

            it('retorna root.chunkedUpload para encadenamiento', () => {
                expect(element.chunkedUpload.reset()).toBe(element.chunkedUpload);
            });
        });

        describe('destroy()', () => {
            it('llama a uppy.destroy()', () => {
                element.chunkedUpload.destroy();
                expect(uppyInstance.destroy).toHaveBeenCalledOnce();
            });

            it('elimina root.chunkedUpload', () => {
                element.chunkedUpload.destroy();
                expect(element.chunkedUpload).toBeUndefined();
            });

            it('no lanza error si se llama dos veces', () => {
                element.chunkedUpload.destroy();
                expect(() => component.init()).not.toThrow();
            });
        });
    });

    // ─── cancel-all event ─────────────────────────────────────────────────────

    describe('cancelAll() event', () => {
        beforeEach(() => component.init());

        it('despacha emg-jsc:chunkedUpload:cancel-all al hacer click en cu-cancel-btn', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:chunkedUpload:cancel-all', handler);
            element.querySelector('.cu-cancel-btn').click();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('reset() despacha emg-jsc:chunkedUpload:cancel-all', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:chunkedUpload:cancel-all', handler);
            element.chunkedUpload.reset();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('cancelAll() de la API pública despacha emg-jsc:chunkedUpload:cancel-all', () => {
            const handler = vi.fn();
            element.addEventListener('emg-jsc:chunkedUpload:cancel-all', handler);
            element.chunkedUpload.cancelAll();
            expect(handler).toHaveBeenCalledOnce();
        });

        it('click en cu-cancel-btn limpia la lista de ficheros del DOM', () => {
            const fakeF = { id: 'f1', name: 'video.mp4', size: 1024, type: 'video/mp4' };
            uppyInstance._emit('file-added', fakeF);
            element.querySelector('.cu-cancel-btn').click();
            expect(element.querySelector('.cu-file-list').children).toHaveLength(0);
            expect(element.querySelector('.cu-file-list').classList.contains('d-none')).toBe(true);
        });

        it('cancelAll() de la API pública limpia la lista de ficheros del DOM', () => {
            const fakeF = { id: 'f1', name: 'video.mp4', size: 1024, type: 'video/mp4' };
            uppyInstance._emit('file-added', fakeF);
            element.chunkedUpload.cancelAll();
            expect(element.querySelector('.cu-file-list').children).toHaveLength(0);
            expect(element.querySelector('.cu-file-list').classList.contains('d-none')).toBe(true);
        });
    });

    // ─── Auto-reset (autoProceed) ─────────────────────────────────────────────

    describe('auto-reset tras upload-success con autoProceed', () => {
        const fakeFile = (overrides = {}) => ({
            id: 'uppy-test-id',
            name: 'video.mp4',
            size: 50 * 1024 * 1024,
            type: 'video/mp4',
            ...overrides,
        });

        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('aplica autoResetDelay por defecto de 3000 ms', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true });
            const c = new ChunkedUpload(el);
            expect(c.settings.autoResetDelay).toBe(3000);
        });

        it('respeta autoResetDelay personalizado desde data-settings', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true, autoResetDelay: 5000 });
            const c = new ChunkedUpload(el);
            expect(c.settings.autoResetDelay).toBe(5000);
        });

        it('oculta cu-file-list tras autoResetDelay ms después de upload-success', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true, autoResetDelay: 3000 });
            const c = new ChunkedUpload(el);
            c.init();
            uppyInstance._emit('file-added', fakeFile());
            uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc' });
            expect(el.querySelector('.cu-file-list').classList.contains('d-none')).toBe(false);
            vi.advanceTimersByTime(3000);
            expect(el.querySelector('.cu-file-list').classList.contains('d-none')).toBe(true);
        });

        it('no oculta cu-file-list antes de que transcurra autoResetDelay', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true, autoResetDelay: 3000 });
            const c = new ChunkedUpload(el);
            c.init();
            uppyInstance._emit('file-added', fakeFile());
            uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc' });
            vi.advanceTimersByTime(2999);
            expect(el.querySelector('.cu-file-list').classList.contains('d-none')).toBe(false);
        });

        it('limpia el DOM de ficheros tras el auto-reset', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true });
            const c = new ChunkedUpload(el);
            c.init();
            uppyInstance._emit('file-added', fakeFile());
            uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc' });
            vi.advanceTimersByTime(3000);
            expect(el.querySelector('.cu-file-list').children).toHaveLength(0);
        });

        it('no dispara auto-reset cuando autoProceed es false', () => {
            component.init();
            uppyInstance._emit('file-added', fakeFile());
            uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc' });
            vi.advanceTimersByTime(10000);
            expect(element.querySelector('.cu-file-list').classList.contains('d-none')).toBe(false);
        });

        it('destroy() cancela el timer de auto-reset pendiente', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true });
            const c = new ChunkedUpload(el);
            c.init();
            uppyInstance._emit('file-added', fakeFile());
            uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc' });
            el.chunkedUpload.destroy();
            expect(() => vi.advanceTimersByTime(3000)).not.toThrow();
        });

        it('reset() manual cancela el timer de auto-reset pendiente', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true });
            const c = new ChunkedUpload(el);
            c.init();
            uppyInstance._emit('file-added', fakeFile());
            uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/files/abc' });
            el.chunkedUpload.reset();
            uppyInstance.cancelAll.mockClear();
            vi.advanceTimersByTime(3000);
            expect(uppyInstance.cancelAll).not.toHaveBeenCalled();
        });
    });

    // ─── Estado de carga (uploading overlay) ─────────────────────────────────

    describe('estado de carga (uploading overlay)', () => {
        beforeEach(() => component.init());

        it('renderiza .cu-dropzone-overlay oculto inicialmente', () => {
            const overlay = element.querySelector('.cu-dropzone-overlay');
            expect(overlay).not.toBeNull();
            expect(overlay.classList.contains('d-none')).toBe(true);
        });

        it('el evento upload de Uppy añade is-uploading al dropzone', () => {
            uppyInstance._emit('upload');
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.classList.contains('is-uploading')).toBe(true);
        });

        it('el evento upload de Uppy muestra el overlay', () => {
            uppyInstance._emit('upload');
            const overlay = element.querySelector('.cu-dropzone-overlay');
            expect(overlay.classList.contains('d-none')).toBe(false);
        });

        it('el evento complete quita is-uploading del dropzone', () => {
            uppyInstance._emit('upload');
            uppyInstance._emit('complete', { successful: [], failed: [] });
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.classList.contains('is-uploading')).toBe(false);
        });

        it('el evento complete oculta el overlay', () => {
            uppyInstance._emit('upload');
            uppyInstance._emit('complete', { successful: [], failed: [] });
            const overlay = element.querySelector('.cu-dropzone-overlay');
            expect(overlay.classList.contains('d-none')).toBe(true);
        });

        it('click en dropzone mientras uploading no hace click en el file input', () => {
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            uppyInstance._emit('upload');
            element.querySelector('.cu-dropzone').click();
            expect(clickSpy).not.toHaveBeenCalled();
        });

        it('drop mientras uploading no llama a uppy.addFile', () => {
            uppyInstance._emit('upload');
            const dropzone = element.querySelector('.cu-dropzone');
            const file = new File(['content'], 'blocked.txt', { type: 'text/plain' });
            const event = new DragEvent('drop', { bubbles: true });
            Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
            dropzone.dispatchEvent(event);
            expect(uppyInstance.addFile).not.toHaveBeenCalled();
        });

        it('dragover mientras uploading no añade is-dragging', () => {
            uppyInstance._emit('upload');
            const dropzone = element.querySelector('.cu-dropzone');
            dropzone.dispatchEvent(new DragEvent('dragover', { bubbles: true }));
            expect(dropzone.classList.contains('is-dragging')).toBe(false);
        });

        it('cancelAll() de la API pública quita is-uploading', () => {
            uppyInstance._emit('upload');
            element.chunkedUpload.cancelAll();
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.classList.contains('is-uploading')).toBe(false);
        });

        it('click en cu-cancel-btn quita is-uploading', () => {
            uppyInstance._emit('upload');
            element.querySelector('.cu-cancel-btn').click();
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.classList.contains('is-uploading')).toBe(false);
        });

        it('reset() quita is-uploading', () => {
            uppyInstance._emit('upload');
            element.chunkedUpload.reset();
            const dropzone = element.querySelector('.cu-dropzone');
            expect(dropzone.classList.contains('is-uploading')).toBe(false);
        });

        it('el overlay contiene un spinner', () => {
            const overlay = element.querySelector('.cu-dropzone-overlay');
            expect(overlay.querySelector('.spinner-border')).not.toBeNull();
        });
    });
});
