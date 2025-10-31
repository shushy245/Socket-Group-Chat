import { Store } from '../store/store';
import { JobStatus, JobResult, JobType } from '../models/job';

export function createJobWorker({ store }: { store: Store }) {
    return async function processJob(jobId: string): Promise<void> {
        const job = store.getJob(jobId);
        if (!job) {
            return;
        }

        // Update status to processing
        store.updateJob({
            ...job,
            status: JobStatus.Processing,
            updatedAt: new Date(),
        });

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Process job and create fake result
        let message = `Job ${jobId} processed successfully`;

        // Include job-specific details in message
        if (job.type === JobType.FileUpload && 'fileName' in job.payload && typeof job.payload.fileName === 'string') {
            message = `File ${job.payload.fileName} processed successfully`;
        }

        const result: JobResult = {
            processedAt: new Date(),
            message,
        };

        // Update status to completed
        const updatedJob = store.getJob(jobId);
        if (updatedJob) {
            store.updateJob({
                ...updatedJob,
                status: JobStatus.Completed,
                result,
                updatedAt: new Date(),
            });
        }
    };
}
