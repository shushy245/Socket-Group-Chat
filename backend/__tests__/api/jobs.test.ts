import supertest from 'supertest';
import { Express } from 'express';
import { createInMemoryStore, Store } from '../../src/store/store';
import { JobStatus, JobType } from '../../src/models/job';
import { createApp } from '../../src/server';
import { aJob } from '../builders/job';

declare const expect: jest.Expect;

describe('Jobs API', () => {
    let app: Express;
    let store: Store;

    beforeEach(() => {
        store = createInMemoryStore();
        app = createApp({ store });
    });

    describe('POST /jobs', () => {
        it('should create a new file upload job', async () => {
            const payload = {
                type: JobType.FileUpload,
                payload: aJob().asFileUpload().build().payload,
            };

            const response = await supertest(app).post('/jobs').send(payload).expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.status).toBe(JobStatus.Pending);
            expect(response.body.type).toBe(JobType.FileUpload);
            expect(response.body.payload.fileName).toBe('test.pdf');

            const createdJob = store.getJob(response.body.id);
            expect(createdJob).toBeDefined();
            expect(createdJob?.status).toBe(JobStatus.Pending);
        });

        it('should create a new chat message job', async () => {
            const payload = {
                type: JobType.ChatMessage,
                payload: aJob().asChatMessage().build().payload,
            };

            const response = await supertest(app).post('/jobs').send(payload).expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.status).toBe(JobStatus.Pending);
            expect(response.body.type).toBe(JobType.ChatMessage);

            const createdJob = store.getJob(response.body.id);
            expect(createdJob).toBeDefined();
        });

        it('should return 400 for invalid job type', async () => {
            const payload = {
                type: 'invalid_type',
                payload: {},
            };

            await supertest(app).post('/jobs').send(payload).expect(400);
        });

        it('should return 400 for missing payload', async () => {
            const payload = {
                type: JobType.FileUpload,
            };

            await supertest(app).post('/jobs').send(payload).expect(400);
        });
    });

    describe('GET /jobs/:id', () => {
        it('should return job when found', async () => {
            const job = aJob().withId('job-123').asFileUpload().build();

            store.createJob(job);

            const response = await supertest(app).get('/jobs/job-123').expect(200);

            expect(response.body.id).toBe('job-123');
            expect(response.body.status).toBe(JobStatus.Pending);
            expect(response.body.type).toBe(JobType.FileUpload);
        });

        it('should return 404 when job not found', async () => {
            await supertest(app).get('/jobs/non-existent').expect(404);
        });

        it('should return job with result when completed', async () => {
            const job = aJob().withId('job-456').asFileUpload().asCompleted('File processed successfully').build();

            store.createJob(job);

            const response = await supertest(app).get('/jobs/job-456').expect(200);

            expect(response.body.status).toBe(JobStatus.Completed);
            expect(response.body.result).toBeDefined();
            expect(response.body.result.message).toBe('File processed successfully');
        });
    });
});
