/**
 * Maximum file size for MVP: 10MB (Base64 increases size by ~33%, so ~7.5MB raw)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Format bytes to human-readable size
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns Error message if validation fails, null if valid
 */
export function validateFileSize(file: File, maxSize: number): string | null {
    if (file.size > maxSize) {
        const fileSize = formatFileSize(file.size);
        const maxSizeFormatted = formatFileSize(maxSize);
        return `File size (${fileSize}) exceeds maximum allowed size (${maxSizeFormatted})`;
    }
    return null;
}

/**
 * Validate file is not empty
 * @param file - File to validate
 * @returns Error message if validation fails, null if valid
 */
export function validateFileNotEmpty(file: File): string | null {
    if (file.size === 0) {
        return 'Cannot upload empty file';
    }
    return null;
}
