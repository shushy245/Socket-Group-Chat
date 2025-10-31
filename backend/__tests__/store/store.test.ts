import { Store } from '../../src/store/store';
import { createInMemoryStore } from '../../src/store/store';
import { JobStatus } from '../../src/models/job';
import { aJob } from '../builders/job';
import { aMessage } from '../builders/message';

declare const expect: jest.Expect;

describe('Store', () => {
    let store: Store;

    beforeEach(() => {
        store = createInMemoryStore();
    });

    describe('Job operations', () => {
        it('should create and get a job', () => {
            const job = aJob().withId('job-123').asFileUpload().build();

            store.createJob(job);
            const retrieved = store.getJob('job-123');

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe('job-123');
            expect(retrieved?.status).toBe(JobStatus.Pending);
        });

        it('should return undefined for non-existent job', () => {
            const retrieved = store.getJob('non-existent');
            expect(retrieved).toBeUndefined();
        });

        it('should update a job', () => {
            const job = aJob().withId('job-123').asFileUpload().build();

            store.createJob(job);

            const updatedJob = aJob().withId('job-123').asFileUpload().asCompleted('Processed successfully').build();

            store.updateJob(updatedJob);
            const retrieved = store.getJob('job-123');

            expect(retrieved?.status).toBe(JobStatus.Completed);
            expect(retrieved?.result).toBeDefined();
        });

        it('should list all jobs', () => {
            const job1 = aJob().withId('job-1').asFileUpload().build();
            const job2 = aJob().withId('job-2').asFileUpload().asCompleted().build();

            store.createJob(job1);
            store.createJob(job2);

            const jobs = store.listJobs();
            expect(jobs).toHaveLength(2);
            expect(jobs.map((j) => j.id)).toContain('job-1');
            expect(jobs.map((j) => j.id)).toContain('job-2');
        });
    });

    describe('Message operations', () => {
        it('should create and get a message', () => {
            const message = aMessage().withId('msg-123').withUserId('user-123').asChatMessage().build();

            store.createMessage(message);
            const retrieved = store.getMessage('msg-123');

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe('msg-123');
            expect(retrieved?.content).toBe('Hello, world!');
        });

        it('should return undefined for non-existent message', () => {
            const retrieved = store.getMessage('non-existent');
            expect(retrieved).toBeUndefined();
        });

        it('should list all messages', () => {
            const message1 = aMessage().withId('msg-1').withUserId('user-1').asChatMessage('Message 1').build();
            const message2 = aMessage().withId('msg-2').withUserId('user-2').asChatMessage('Message 2').build();

            store.createMessage(message1);
            store.createMessage(message2);

            const messages = store.listMessages();
            expect(messages).toHaveLength(2);
            expect(messages.map((m) => m.id)).toContain('msg-1');
            expect(messages.map((m) => m.id)).toContain('msg-2');
        });

        it('should list messages in order by timestamp', () => {
            const now = new Date();
            const message1 = aMessage()
                .withId('msg-1')
                .withUserId('user-1')
                .asChatMessage('First')
                .withTimestamp(new Date(now.getTime() - 1000))
                .build();

            const message2 = aMessage()
                .withId('msg-2')
                .withUserId('user-2')
                .asChatMessage('Second')
                .withTimestamp(new Date(now.getTime() - 500))
                .build();

            const message3 = aMessage()
                .withId('msg-3')
                .withUserId('user-3')
                .asChatMessage('Third')
                .withTimestamp(now)
                .build();

            store.createMessage(message3);
            store.createMessage(message1);
            store.createMessage(message2);

            const messages = store.listMessages();
            expect(messages[0].id).toBe('msg-1');
            expect(messages[1].id).toBe('msg-2');
            expect(messages[2].id).toBe('msg-3');
        });
    });
});
