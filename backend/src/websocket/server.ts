import { WebSocketServer, WebSocket } from 'ws';
import { Store } from '../store/store';
import { Message, MessageType } from '../models/message';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function createWebSocketServer({ port, store }: { port: number; store: Store }): WebSocketServer {
    const wss = new WebSocketServer({ port });

    wss.on('connection', (ws: WebSocket) => {
        logger.info({}, 'WebSocket connection established');

        ws.on('message', (data: Buffer) => {
            try {
                const payload = JSON.parse(data.toString());

                if (payload.type === 'chat') {
                    const message: Message = {
                        id: uuidv4(),
                        userId: payload.userId,
                        content: payload.content,
                        type: MessageType.Message,
                        timestamp: new Date(),
                    };

                    store.createMessage(message);
                    logger.info({ messageId: message.id, userId: message.userId }, 'Chat message received');

                    const broadcastMessage = {
                        id: message.id,
                        userId: message.userId,
                        content: message.content,
                        type: message.type,
                        timestamp: message.timestamp,
                    };

                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(broadcastMessage));
                        }
                    });
                } else if (payload.type === 'file') {
                    const message: Message = {
                        id: uuidv4(),
                        userId: payload.userId,
                        content: payload.fileName,
                        type: MessageType.File,
                        fileData: {
                            fileName: payload.fileName,
                            fileType: payload.fileType,
                            fileSize: payload.fileSize,
                            data: payload.data,
                        },
                        timestamp: new Date(),
                    };

                    store.createMessage(message);
                    logger.info(
                        { messageId: message.id, userId: message.userId, fileName: payload.fileName },
                        'File upload message received',
                    );

                    const broadcastMessage = {
                        id: message.id,
                        userId: message.userId,
                        content: message.content,
                        type: message.type,
                        fileData: message.fileData,
                        timestamp: message.timestamp,
                    };

                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(broadcastMessage));
                        }
                    });
                }
            } catch (error) {
                logger.error({ error }, 'Error processing WebSocket message');
            }
        });
    });

    return wss;
}
