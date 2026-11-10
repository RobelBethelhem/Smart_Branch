import cv from '@techstark/opencv-js';

/**
 * True once OpenCV's WebAssembly runtime has finished starting (its classes exist).
 *
 * OpenCV is imported statically here on purpose, and this module only ever hands out a
 * boolean. The OpenCV module object has a `then` method that resolves to itself, so anything
 * that awaits it (including `await import('@techstark/opencv-js')`) sends the promise
 * machinery into an endless loop and freezes the page. Never return `cv` from an async
 * function or pass it through a promise.
 */
export function isOpenCvRuntimeReady(): boolean {
  return !!cv && typeof (cv as any).Mat === 'function';
}
