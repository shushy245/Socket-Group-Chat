import '@testing-library/jest-dom';
import { validateFileSize, validateFileNotEmpty, formatFileSize, MAX_FILE_SIZE } from './fileValidation';

declare const expect: jest.Expect;

describe('fileValidation utilities', () => {
    describe('formatFileSize', () => {
        it('should format zero bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
        });

        it('should format bytes correctly', () => {
            expect(formatFileSize(500)).toBe('500 Bytes');
        });

        it('should format KB correctly', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
        });

        it('should format MB correctly', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
        });

        it('should format GB correctly', () => {
            expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
        });
    });

    describe('validateFileSize', () => {
        it('should return null for file under limit', () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: 1024, writable: false });

            expect(validateFileSize(file, MAX_FILE_SIZE)).toBeNull();
        });

        it('should return null for file at limit', () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE, writable: false });

            expect(validateFileSize(file, MAX_FILE_SIZE)).toBeNull();
        });

        it('should return error for file over limit', () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1, writable: false });

            const error = validateFileSize(file, MAX_FILE_SIZE);
            expect(error).toBeTruthy();
            expect(error).toContain('exceeds maximum allowed size');
        });

        it('should return error with formatted sizes', () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024, writable: false });

            const error = validateFileSize(file, MAX_FILE_SIZE);
            expect(error).toContain('11 MB');
            expect(error).toContain('10 MB');
        });
    });

    describe('validateFileNotEmpty', () => {
        it('should return null for non-empty file', () => {
            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: 1024, writable: false });

            expect(validateFileNotEmpty(file)).toBeNull();
        });

        it('should return error for empty file', () => {
            const file = new File([], 'empty.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: 0, writable: false });

            const error = validateFileNotEmpty(file);
            expect(error).toBeTruthy();
            expect(error).toContain('Cannot upload empty file');
        });
    });
});
