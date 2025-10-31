import { Job, JobStatus, JobType, FileUploadPayload, JobResult } from '../../src/models/job';
import { v4 as uuidv4 } from 'uuid';

export function aJob() {
    const now = new Date();
    const job: Job = {
        id: uuidv4(),
        status: JobStatus.Pending,
        type: JobType.FileUpload,
        payload: {
            fileName: 'test.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            data: 'base64data',
        },
        createdAt: now,
        updatedAt: now,
    };

    const builder = {
        build: (): Job => ({ ...job }),
        withId(id: string) {
            job.id = id;
            return builder;
        },
        withStatus(status: JobStatus) {
            job.status = status;
            return builder;
        },
        withType(type: JobType) {
            job.type = type;
            return builder;
        },
        withPayload(payload: FileUploadPayload | Record<string, unknown>) {
            job.payload = payload;
            return builder;
        },
        withResult(result: JobResult) {
            job.result = result;
            return builder;
        },
        withCreatedAt(date: Date) {
            job.createdAt = date;
            return builder;
        },
        withUpdatedAt(date: Date) {
            job.updatedAt = date;
            return builder;
        },
        asFileUpload(fileName: string = 'test.pdf', fileType: string = 'application/pdf', fileSize: number = 1024) {
            job.type = JobType.FileUpload;
            job.payload = {
                fileName,
                fileType,
                fileSize,
                data: 'base64data',
            };
            return builder;
        },
        asChatMessage(content: string = 'Hello, world!') {
            job.type = JobType.ChatMessage;
            job.payload = {
                content,
            };
            return builder;
        },
        asCompleted(message: string = 'Job processed successfully') {
            job.status = JobStatus.Completed;
            job.result = {
                processedAt: new Date(),
                message,
            };
            return builder;
        },
        asFailed() {
            job.status = JobStatus.Failed;
            return builder;
        },
        asProcessing() {
            job.status = JobStatus.Processing;
            return builder;
        },
    };

    return builder;
}
