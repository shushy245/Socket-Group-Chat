import { createApp } from './server';
import { createWebSocketServer } from './websocket/server';
import { createInMemoryStore } from './store/store';
import { createJobWorker } from './services/job-worker';
import { logger } from './utils/logger';
import { JobStatus } from './models/job';

const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 8080;

const store = createInMemoryStore();
const app = createApp({ store });
const jobWorker = createJobWorker({ store });

const httpServer = app.listen(HTTP_PORT, () => {
    logger.info({ port: HTTP_PORT }, 'HTTP server started');
});

const wss = createWebSocketServer({ port: WS_PORT, store });

logger.info({ port: WS_PORT }, 'WebSocket server started');

/** Process jobs from queue */
setInterval(() => {
    const pendingJobs = store.listJobs().filter((job) => job.status === JobStatus.Pending);
    pendingJobs.forEach((job) => {
        jobWorker(job.id).catch((error) => {
            logger.error({ jobId: job.id, error }, 'Failed to process job');
        });
    });
}, 500);

/** Graceful shutdown */
const shutdown = () => {
    logger.info('Shutting down servers...');
    httpServer.close(() => {
        logger.info('HTTP server closed');
        wss.close(() => {
            logger.info('WebSocket server closed');
            process.exit(0);
        });
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
