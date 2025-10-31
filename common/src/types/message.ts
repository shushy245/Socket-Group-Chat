export enum MessageType {
    Message = 'message',
    File = 'file',
}

export interface FileData {
    fileName: string;
    fileType: string;
    fileSize: number;
    data: string; // Base64 encoded
}

export interface Message {
    id: string;
    userId: string;
    content: string;
    type: MessageType;
    fileData?: FileData;
    timestamp: Date;
}
