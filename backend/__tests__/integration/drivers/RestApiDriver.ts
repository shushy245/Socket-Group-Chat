import supertest, { Test } from 'supertest';
import { Express } from 'express';
import { JobType } from '../../../src/models/job';

export class RestApiDriver {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
    }

    createFileUploadJob(payload: { fileName: string; fileType: string; fileSize: number; data: string }): Test {
        return supertest(this.app).post('/jobs').send({
            type: JobType.FileUpload,
            payload,
        });
    }

    getJobStatus(jobId: string): Test {
        return supertest(this.app).get(`/jobs/${jobId}`);
    }
}
