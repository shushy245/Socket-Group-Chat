import { createJobWorker } from '../../src/services/job-worker';
import { createInMemoryStore } from '../../src/store/store';
import { Store } from '../../src/store/store';
import { JobStatus } from '../../src/models/job';
import { aJob } from '../builders/job';

declare const expect: jest.Expect;

describe('JobWorker', () => {
    let store: Store;
    let processJob: (jobId: string) => Promise<void>;

    beforeEach(() => {
        store = createInMemoryStore();
        processJob = createJobWorker({ store });
    });

    it('should update job status to processing when started', async () => {
        const job = aJob().withId('job-123').asFileUpload().build();

        store.createJob(job);
        const processPromise = processJob('job-123');

        // Check status is immediately set to processing
        const processingJob = store.getJob('job-123');
        expect(processingJob?.status).toBe(JobStatus.Processing);

        await processPromise;
    });

    it('should process job and update status to completed with result', async () => {
        const job = aJob().withId('job-123').asFileUpload().build();

        store.createJob(job);

        await processJob('job-123');

        const completedJob = store.getJob('job-123');
        expect(completedJob?.status).toBe(JobStatus.Completed);
        expect(completedJob?.result).toBeDefined();
        expect(completedJob?.result?.message).toContain('processed');
    });

    it('should include job details in result message', async () => {
        const job = aJob().withId('job-123').asFileUpload('document.pdf', 'application/pdf', 2048).build();

        store.createJob(job);

        await processJob('job-123');

        const completedJob = store.getJob('job-123');
        expect(completedJob?.result?.message).toContain('document.pdf');
    });

    it('should handle chat message job type', async () => {
        const job = aJob().withId('job-456').asChatMessage().build();

        store.createJob(job);

        await processJob('job-456');

        const completedJob = store.getJob('job-456');
        expect(completedJob?.status).toBe(JobStatus.Completed);
        expect(completedJob?.result).toBeDefined();
    });
});
