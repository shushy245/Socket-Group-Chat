import { WebSocketServer, WebSocket } from 'ws';
import { createInMemoryStore, Store } from '../../src/store/store';
import { MessageType } from '../../src/models/message';
import { createWebSocketServer } from '../../src/websocket/server';

declare const expect: jest.Expect;

describe('WebSocket Server', () => {
    let wss: WebSocketServer;
    let store: Store;
    let port: number;
    let clients: WebSocket[];

    beforeEach(() => {
        store = createInMemoryStore();
        port = 8080 + Math.floor(Math.random() * 1000);
        clients = [];
        wss = createWebSocketServer({ port, store });
    });

    afterEach((done) => {
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
                client.close();
            }
        });
        clients = [];

        wss.close(() => {
            done();
        });
    });

    it('should accept WebSocket connections', (done) => {
        const client = new WebSocket(`ws://localhost:${port}`);
        clients.push(client);

        client.on('open', () => {
            expect(client.readyState).toBe(WebSocket.OPEN);
            client.close();
            done();
        });

        client.on('error', (error) => {
            done(error);
        });
    });

    it('should broadcast chat messages to all connected clients', (done) => {
        const client1 = new WebSocket(`ws://localhost:${port}`);
        const client2 = new WebSocket(`ws://localhost:${port}`);
        clients.push(client1, client2);

        let messagesReceived = 0;
        const onMessage = (data: Buffer) => {
            const message = JSON.parse(data.toString());
            expect(message.type).toBe(MessageType.Message);
            expect(message.content).toBe('Hello, world!');
            messagesReceived++;
            if (messagesReceived === 2) {
                client1.close();
                client2.close();
                done();
            }
        };

        let client1Open = false;
        let client2Open = false;

        const trySendMessage = () => {
            if (client1Open && client2Open) {
                client1.on('message', onMessage);
                client2.on('message', onMessage);

                const chatMessage = {
                    type: 'chat',
                    userId: 'user-123',
                    content: 'Hello, world!',
                };

                client1.send(JSON.stringify(chatMessage));
            }
        };

        client1.on('open', () => {
            client1Open = true;
            trySendMessage();
        });

        client2.on('open', () => {
            client2Open = true;
            trySendMessage();
        });

        client1.on('error', (error) => {
            done(error);
        });

        client2.on('error', (error) => {
            done(error);
        });
    });

    it('should store chat messages in the store', (done) => {
        const client = new WebSocket(`ws://localhost:${port}`);
        clients.push(client);

        client.on('open', () => {
            const chatMessage = {
                type: 'chat',
                userId: 'user-123',
                content: 'Hello, world!',
            };

            client.send(JSON.stringify(chatMessage));

            setTimeout(() => {
                const messages = store.listMessages();
                expect(messages).toHaveLength(1);
                expect(messages[0].content).toBe('Hello, world!');
                expect(messages[0].userId).toBe('user-123');
                expect(messages[0].type).toBe(MessageType.Message);
                client.close();
                done();
            }, 100);
        });

        client.on('error', (error) => {
            done(error);
        });
    });

    it('should broadcast file upload messages to all connected clients', (done) => {
        const client1 = new WebSocket(`ws://localhost:${port}`);
        const client2 = new WebSocket(`ws://localhost:${port}`);
        clients.push(client1, client2);

        let messagesReceived = 0;
        const onMessage = (data: Buffer) => {
            const message = JSON.parse(data.toString());
            expect(message.type).toBe(MessageType.File);
            expect(message.fileData?.fileName).toBe('test.pdf');
            messagesReceived++;
            if (messagesReceived === 2) {
                client1.close();
                client2.close();
                done();
            }
        };

        let client1Open = false;
        let client2Open = false;

        const trySendMessage = () => {
            if (client1Open && client2Open) {
                client1.on('message', onMessage);
                client2.on('message', onMessage);

                const fileMessage = {
                    type: 'file',
                    userId: 'user-123',
                    fileName: 'test.pdf',
                    fileType: 'application/pdf',
                    fileSize: 1024,
                    data: 'base64data',
                };

                client1.send(JSON.stringify(fileMessage));
            }
        };

        client1.on('open', () => {
            client1Open = true;
            trySendMessage();
        });

        client2.on('open', () => {
            client2Open = true;
            trySendMessage();
        });

        client1.on('error', (error) => {
            done(error);
        });

        client2.on('error', (error) => {
            done(error);
        });
    });

    it('should store file upload messages in the store', (done) => {
        const client = new WebSocket(`ws://localhost:${port}`);
        clients.push(client);

        client.on('open', () => {
            const fileMessage = {
                type: 'file',
                userId: 'user-123',
                fileName: 'test.pdf',
                fileType: 'application/pdf',
                fileSize: 1024,
                data: 'base64data',
            };

            client.send(JSON.stringify(fileMessage));

            setTimeout(() => {
                const messages = store.listMessages();
                expect(messages).toHaveLength(1);
                expect(messages[0].type).toBe(MessageType.File);
                expect(messages[0].fileData?.fileName).toBe('test.pdf');
                client.close();
                done();
            }, 100);
        });

        client.on('error', (error) => {
            done(error);
        });
    });
});
