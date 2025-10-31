/**
 * Encode a File to Base64 string
 * @param file - The file to encode
 * @returns Promise resolving to Base64 encoded string (without data URL prefix)
 */
export async function encodeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                // Remove data URL prefix (e.g., "data:text/plain;base64,")
                const parts = result.split(',');
                const base64 = parts.length > 1 ? parts[1] : '';
                resolve(base64);
            } else {
                reject(new Error('Failed to read file as string'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Decode a Base64 string to Blob
 * @param base64 - The Base64 encoded string (without data URL prefix)
 * @param mimeType - The MIME type of the blob
 * @returns Blob instance
 */
export function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}
