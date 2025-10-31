import { JobStatus, JobType } from '../../src/models/job';
import { aJob } from '../builders/job';

declare const expect: jest.Expect;

describe('Job Model', () => {
    it('should create a job with required fields', () => {
        const job = aJob().withId('job-123').asFileUpload().build();

        expect(job.id).toBe('job-123');
        expect(job.status).toBe(JobStatus.Pending);
        expect(job.type).toBe(JobType.FileUpload);
        expect(job.payload.fileName).toBe('test.pdf');
    });

    it('should handle job with result', () => {
        const job = aJob().withId('job-123').asFileUpload().asCompleted('File processed successfully').build();

        expect(job.status).toBe(JobStatus.Completed);
        expect(job.result).toBeDefined();
        expect(job.result?.message).toBe('File processed successfully');
    });

    it('should serialize to JSON', () => {
        const job = aJob()
            .withId('job-123')
            .asFileUpload()
            .withCreatedAt(new Date('2024-01-01T12:00:00Z'))
            .withUpdatedAt(new Date('2024-01-01T12:00:00Z'))
            .build();

        const json = JSON.stringify(job);
        const parsed = JSON.parse(json);

        expect(parsed.id).toBe('job-123');
        expect(parsed.status).toBe(JobStatus.Pending);
        expect(parsed.createdAt).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should deserialize from JSON', () => {
        const json = {
            id: 'job-123',
            status: JobStatus.Pending,
            type: JobType.FileUpload,
            payload: {
                fileName: 'test.pdf',
                fileType: 'application/pdf',
                fileSize: 1024,
                data: 'base64data',
            },
            createdAt: '2024-01-01T12:00:00.000Z',
            updatedAt: '2024-01-01T12:00:00.000Z',
        };

        const job = JSON.parse(JSON.stringify(json));
        job.createdAt = new Date(job.createdAt);
        job.updatedAt = new Date(job.updatedAt);

        expect(job.id).toBe('job-123');
        expect(job.status).toBe(JobStatus.Pending);
        expect(job.createdAt).toBeInstanceOf(Date);
    });
});
