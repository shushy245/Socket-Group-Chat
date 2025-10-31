import express, { Express } from 'express';
import cors from 'cors';
import { Store } from './store/store';
import { initJobsApi } from './api/jobs';

export function createApp({ store }: { store: Store }): Express {
    const app = express();

    app.use(cors());
    app.use(express.json());

    const router = express.Router();
    initJobsApi({ router, store });
    app.use(router);

    return app;
}
