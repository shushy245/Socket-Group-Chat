import { Router, Request, Response } from 'express';
import { Store } from '../store/store';
import { Job, JobStatus, JobType } from '../models/job';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function initJobsApi({ router, store }: { router: Router; store: Store }) {
    router.post('/jobs', (req: Request, res: Response) => {
        const { type, payload } = req.body;

        if (!type || !Object.values(JobType).includes(type)) {
            res.status(400).json({ error: 'Invalid job type' });
            return;
        }

        if (!payload) {
            res.status(400).json({ error: 'Payload is required' });
            return;
        }

        const now = new Date();
        const job: Job = {
            id: uuidv4(),
            status: JobStatus.Pending,
            type,
            payload,
            createdAt: now,
            updatedAt: now,
        };

        store.createJob(job);
        logger.info({ jobId: job.id, type: job.type }, 'Job created');

        res.status(201).json(job);
    });

    router.get('/jobs/:id', (req: Request, res: Response) => {
        const { id } = req.params;
        const job = store.getJob(id);

        if (!job) {
            logger.warn({ jobId: id }, 'Job not found');
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        logger.debug({ jobId: id, status: job.status }, 'Job retrieved');
        res.json(job);
    });
}
