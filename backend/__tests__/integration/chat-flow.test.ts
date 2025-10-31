import { Express } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from '../../src/server';
import { createInMemoryStore, Store } from '../../src/store/store';
import { createWebSocketServer } from '../../src/websocket/server';
import { createJobWorker } from '../../src/services/job-worker';
import { JobStatus } from '../../src/models/job';
import { MessageType } from '../../src/models/message';
import { aJob } from '../builders/job';
import { aChatMessage, aFileMessage } from '../builders/websocket-message';
import { WebSocketClientDriver } from './drivers/WebSocketClientDriver';
import { RestApiDriver } from './drivers/RestApiDriver';
import { StoreDriver } from './drivers/StoreDriver';

declare const expect: jest.Expect;

describe('Chat Flow Integration Tests', () => {
    let app: Express;
    let store: Store;
    let httpServer: Server;
    let wss: WebSocketServer;
    let jobWorker: (jobId: string) => Promise<void>;
    let httpPort: number;
    let wsPort: number;
    let clients: WebSocketClientDriver[];

    beforeEach(() => {
        store = createInMemoryStore();
        app = createApp({ store });
        jobWorker = createJobWorker({ store });
        httpPort = 3000 + Math.floor(Math.random() * 1000);
        wsPort = 8080 + Math.floor(Math.random() * 1000);
        clients = [];

        httpServer = app.listen(httpPort);
        wss = createWebSocketServer({ port: wsPort, store });
    });

    afterEach((done) => {
        clients.forEach((client) => {
            client.close();
        });
        clients = [];

        wss.close(() => {
            httpServer.close(() => {
                done();
            });
        });
    });

    describe('Chat Message Flow', () => {
        it('should handle complete chat message flow: send → store → broadcast → receive', async () => {
            const client1 = new WebSocketClientDriver(`ws://localhost:${wsPort}`);
            const client2 = new WebSocketClientDriver(`ws://localhost:${wsPort}`);
            clients.push(client1, client2);

            await Promise.all([client1.connect(), client2.connect()]);

            const chatMessage = aChatMessage().withContent('Hello, world!').build();
            let messagesReceived = 0;

            const onMessage = () => {
                messagesReceived++;
            };

            client1.onMessage(onMessage);
            client2.onMessage(onMessage);

            client1.sendChatMessage(chatMessage.userId, chatMessage.content);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const storeDriver = new StoreDriver(store);
            const messages = storeDriver.getMessages();

            expect(messagesReceived).toBe(2);
            expect(messages).toHaveLength(1);
            expect(messages[0].content).toBe('Hello, world!');
            expect(messages[0].userId).toBe('user-123');
            expect(messages[0].type).toBe(MessageType.Message);
        });
    });

    describe('File Upload Flow', () => {
        it('should handle complete file upload flow: REST job → WebSocket file → job processing', async () => {
            const restApiDriver = new RestApiDriver(app);
            const storeDriver = new StoreDriver(store);

            const job = aJob().asFileUpload('test.pdf', 'application/pdf', 1024).build();
            const filePayload = job.payload;

            if (
                'fileName' in filePayload &&
                typeof filePayload.fileName === 'string' &&
                'fileType' in filePayload &&
                typeof filePayload.fileType === 'string' &&
                'fileSize' in filePayload &&
                typeof filePayload.fileSize === 'number' &&
                'data' in filePayload &&
                typeof filePayload.data === 'string'
            ) {
                const jobResponse = await restApiDriver
                    .createFileUploadJob({
                        fileName: filePayload.fileName,
                        fileType: filePayload.fileType,
                        fileSize: filePayload.fileSize,
                        data: filePayload.data,
                    })
                    .expect(201);
                const jobId = jobResponse.body.id;

                expect(jobResponse.body.status).toBe(JobStatus.Pending);
                expect(jobResponse.body.type).toBe('file_upload');

                const client = new WebSocketClientDriver(`ws://localhost:${wsPort}`);
                clients.push(client);
                await client.connect();

                const fileMessage = aFileMessage()
                    .withFileName('test.pdf')
                    .withFileType('application/pdf')
                    .withFileSize(1024)
                    .build();

                client.sendFileMessage(
                    fileMessage.userId,
                    fileMessage.fileName,
                    fileMessage.fileType,
                    fileMessage.fileSize,
                    fileMessage.data,
                );

                await new Promise((resolve) => setTimeout(resolve, 100));

                expect(storeDriver.hasMessageWithType(MessageType.File)).toBe(true);
                expect(storeDriver.hasMessageWithFileName('test.pdf')).toBe(true);

                await jobWorker(jobId);

                const jobStatusResponse = await restApiDriver.getJobStatus(jobId).expect(200);
                expect(jobStatusResponse.body.status).toBe(JobStatus.Completed);
                expect(jobStatusResponse.body.result).toBeDefined();
                if (
                    jobStatusResponse.body.result &&
                    typeof jobStatusResponse.body.result === 'object' &&
                    'message' in jobStatusResponse.body.result &&
                    typeof jobStatusResponse.body.result.message === 'string'
                ) {
                    expect(jobStatusResponse.body.result.message).toContain('test.pdf');
                }
            }
        });
    });

    describe('Multiple Clients Broadcasting', () => {
        it('should broadcast messages to all connected clients', async () => {
            const client1 = new WebSocketClientDriver(`ws://localhost:${wsPort}`);
            const client2 = new WebSocketClientDriver(`ws://localhost:${wsPort}`);
            const client3 = new WebSocketClientDriver(`ws://localhost:${wsPort}`);
            clients.push(client1, client2, client3);

            await Promise.all([client1.connect(), client2.connect(), client3.connect()]);

            const chatMessage = aChatMessage().withContent('Broadcast test').build();
            let messagesReceived = 0;
            const expectedMessages = 3;

            const onMessage = () => {
                messagesReceived++;
            };

            client1.onMessage(onMessage);
            client2.onMessage(onMessage);
            client3.onMessage(onMessage);

            client1.sendChatMessage(chatMessage.userId, chatMessage.content);

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(messagesReceived).toBe(expectedMessages);
        });
    });
});
