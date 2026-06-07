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

        it('oculta cu-upload-btn cuando autoProceed es true', () => {
            const el = createElement({ endpoint: '/files/', autoProceed: true });
            const c = new ChunkedUpload(el);
            c.init();
            const btn = el.querySelector('.cu-upload-btn');
            expect(btn.classList.contains('d-none')).toBe(true);
        });
    });

    // ─── Interacción UI ───────────────────────────────────────────────────────

    describe('Interacción UI', () => {
        beforeEach(() => component.init());

        it('click en cu-browse-btn hace click en el file input', () => {
            const input = element.querySelector('.cu-file-input');
            const clickSpy = vi.spyOn(input, 'click');
            element.querySelector('.cu-browse-btn').click();
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

            it('hace visible cu-file-list y cu-actions', () => {
                uppyInstance._emit('file-added', fakeFile());
                expect(element.querySelector('.cu-file-list').classList.contains('d-none')).toBe(false);
                expect(element.querySelector('.cu-actions').classList.contains('d-none')).toBe(false);
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
                uppyInstance._emit('upload-progress', fakeFile(), { percentage: 40 });
                const li = element.querySelector('[data-file-id="uppy-test-id"]');
                const progress = li.querySelector('.progress');
                expect(progress.classList.contains('d-none')).toBe(false);
            });

            it('actualiza el ancho del progress-bar con el porcentaje', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { percentage: 65 });
                const li = element.querySelector('[data-file-id="uppy-test-id"]');
                expect(li.querySelector('.cu-progress-bar').style.width).toBe('65%');
            });

            it('actualiza el badge a "Subiendo…" con clase bg-primary', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-progress', fakeFile(), { percentage: 30 });
                const badge = element.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Subiendo…');
                expect(badge.classList.contains('bg-primary')).toBe(true);
            });

            it('despacha emg-jsc:chunkedUpload:progress con el detail correcto', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:progress', handler);
                const file = fakeFile();
                const progress = { percentage: 50 };
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-progress', file, progress);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ file, progress });
            });
        });

        describe('upload-success', () => {
            it('actualiza el badge a "Completado" con clase bg-success', () => {
                uppyInstance._emit('file-added', fakeFile());
                uppyInstance._emit('upload-success', fakeFile(), { uploadURL: 'https://example.com/file' });
                const badge = element.querySelector('[data-file-id="uppy-test-id"] .cu-file-status');
                expect(badge.textContent).toBe('Completado');
                expect(badge.classList.contains('bg-success')).toBe(true);
            });

            it('despacha emg-jsc:chunkedUpload:upload-success', () => {
                const handler = vi.fn();
                element.addEventListener('emg-jsc:chunkedUpload:upload-success', handler);
                const file = fakeFile();
                const response = { uploadURL: 'https://example.com/file' };
                uppyInstance._emit('file-added', file);
                uppyInstance._emit('upload-success', file, response);
                expect(handler).toHaveBeenCalledOnce();
                expect(handler.mock.calls[0][0].detail).toEqual({ file, response });
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
    });
});
