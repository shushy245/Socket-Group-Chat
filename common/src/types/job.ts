export enum JobStatus {
    Pending = 'pending',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
}

export enum JobType {
    FileUpload = 'file_upload',
    ChatMessage = 'chat_message',
}

export interface FileUploadPayload {
    fileName: string;
    fileType: string;
    fileSize: number;
    data: string; // Base64 encoded
}

export interface JobResult {
    processedAt: Date;
    message: string;
}

export interface Job {
    id: string;
    status: JobStatus;
    type: JobType;
    payload: FileUploadPayload | Record<string, unknown>;
    result?: JobResult;
    createdAt: Date;
    updatedAt: Date;
}
