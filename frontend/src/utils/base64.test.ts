import '@testing-library/jest-dom';
import { encodeFile, decodeBase64ToBlob } from './base64';

declare const expect: jest.Expect;

describe('base64 utilities', () => {
    describe('encodeFile', () => {
        it('should encode a text file to base64', async () => {
            const content = 'Hello, World!';
            const file = new File([content], 'test.txt', { type: 'text/plain' });

            const result = await encodeFile(file);

            expect(result).toBe(btoa(content));
        });

        it('should encode a PDF file to base64', async () => {
            const content = 'PDF content here';
            const file = new File([content], 'test.pdf', { type: 'application/pdf' });

            const result = await encodeFile(file);

            expect(result).toBe(btoa(content));
        });

        it('should encode binary content correctly', async () => {
            const binaryContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in bytes
            const file = new File([binaryContent], 'test.bin', { type: 'application/octet-stream' });

            const result = await encodeFile(file);

            expect(result).toBe(btoa(String.fromCharCode(...binaryContent)));
        });

        it('should handle empty files', async () => {
            const file = new File([], 'empty.txt', { type: 'text/plain' });

            const result = await encodeFile(file);

            expect(result).toBe('');
        });

        it('should handle large files', async () => {
            const largeContent = 'x'.repeat(100000);
            const file = new File([largeContent], 'large.txt', { type: 'text/plain' });

            const result = await encodeFile(file);

            expect(result.length).toBeGreaterThan(0);
            expect(result).toBe(btoa(largeContent));
        });
    });

    describe('decodeBase64ToBlob', () => {
        it('should decode base64 string to blob', () => {
            const base64 = btoa('Hello, World!');
            const mimeType = 'text/plain';

            const blob = decodeBase64ToBlob(base64, mimeType);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe(mimeType);
            expect(blob.size).toBe(13);
        });

        it('should decode base64 with correct mime type', () => {
            const base64 = btoa('PDF content');
            const mimeType = 'application/pdf';

            const blob = decodeBase64ToBlob(base64, mimeType);

            expect(blob.type).toBe(mimeType);
        });

        it('should handle empty base64 string', () => {
            const base64 = '';
            const mimeType = 'text/plain';

            const blob = decodeBase64ToBlob(base64, mimeType);

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.size).toBe(0);
            expect(blob.type).toBe(mimeType);
        });

        it('should decode binary content correctly', () => {
            const binaryContent = new Uint8Array([72, 101, 108, 108, 111]);
            const base64 = btoa(String.fromCharCode(...binaryContent));
            const mimeType = 'application/octet-stream';

            const blob = decodeBase64ToBlob(base64, mimeType);

            expect(blob.type).toBe(mimeType);
            expect(blob.size).toBe(5);
        });

        it('should handle different mime types', () => {
            const base64 = btoa('image content');
            const mimeTypes = ['image/png', 'image/jpeg', 'application/json'];

            mimeTypes.forEach((mimeType) => {
                const blob = decodeBase64ToBlob(base64, mimeType);
                expect(blob.type).toBe(mimeType);
            });
        });

        it('should handle invalid base64 gracefully', () => {
            const invalidBase64 = '!!!invalid-base64!!!';
            const mimeType = 'text/plain';

            expect(() => {
                decodeBase64ToBlob(invalidBase64, mimeType);
            }).toThrow();
        });

        it('should handle missing mimeType', () => {
            const base64 = btoa('test content');
            const mimeType = '';

            const blob = decodeBase64ToBlob(base64, mimeType);
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('');
        });
    });

    describe('encodeFile and decodeBase64ToBlob integration', () => {
        it('should encode and decode correctly', async () => {
            const originalContent = 'Hello, World!';
            const file = new File([originalContent], 'test.txt', { type: 'text/plain' });

            const base64 = await encodeFile(file);
            const blob = decodeBase64ToBlob(base64, file.type);

            const decodedContent = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to read blob'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read blob'));
                reader.readAsText(blob);
            });

            expect(decodedContent).toBe(originalContent);
        });

        it('should preserve binary content through encode/decode', async () => {
            const binaryContent = new Uint8Array([1, 2, 3, 4, 5]);
            const file = new File([binaryContent], 'test.bin', { type: 'application/octet-stream' });

            const base64 = await encodeFile(file);
            const blob = decodeBase64ToBlob(base64, file.type);

            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (reader.result instanceof ArrayBuffer) {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to read blob'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read blob'));
                reader.readAsArrayBuffer(blob);
            });
            const decodedArray = new Uint8Array(arrayBuffer);

            expect(decodedArray).toEqual(binaryContent);
        });
    });
});
