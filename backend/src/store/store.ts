import { Job } from '../models/job';
import { Message } from '../models/message';

export interface Store {
    createJob(job: Job): void;
    getJob(id: string): Job | undefined;
    updateJob(job: Job): void;
    listJobs(): Job[];

    createMessage(message: Message): void;
    getMessage(id: string): Message | undefined;
    listMessages(): Message[];
}

export function createInMemoryStore(): Store {
    const jobs = new Map<string, Job>();
    const messages = new Map<string, Message>();

    return {
        createJob(job: Job): void {
            jobs.set(job.id, { ...job });
        },

        getJob(id: string): Job | undefined {
            const job = jobs.get(id);
            return job ? { ...job } : undefined;
        },

        updateJob(job: Job): void {
            if (jobs.has(job.id)) {
                jobs.set(job.id, { ...job });
            }
        },

        listJobs(): Job[] {
            return Array.from(jobs.values()).map((job) => ({ ...job }));
        },

        createMessage(message: Message): void {
            messages.set(message.id, { ...message });
        },

        getMessage(id: string): Message | undefined {
            const message = messages.get(id);
            return message ? { ...message } : undefined;
        },

        listMessages(): Message[] {
            return Array.from(messages.values())
                .map((msg) => ({ ...msg }))
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        },
    };
}
