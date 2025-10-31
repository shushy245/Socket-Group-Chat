import { WebSocket } from 'ws';

export class WebSocketClientDriver {
    private client: WebSocket;
    private url: string;
    private connected = false;
    private messages: Buffer[] = [];

    constructor(url: string) {
        this.url = url;
        this.client = new WebSocket(url);
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.on('open', () => {
                this.connected = true;
                resolve();
            });

            this.client.on('error', (error) => {
                reject(error);
            });

            this.client.on('message', (data: Buffer) => {
                this.messages.push(data);
            });
        });
    }

    sendChatMessage(userId: string, content: string): void {
        if (!this.connected) {
            throw new Error('WebSocket not connected. Call connect() first.');
        }
        this.client.send(
            JSON.stringify({
                type: 'chat',
                userId,
                content,
            }),
        );
    }

    sendFileMessage(userId: string, fileName: string, fileType: string, fileSize: number, data: string): void {
        if (!this.connected) {
            throw new Error('WebSocket not connected. Call connect() first.');
        }
        this.client.send(
            JSON.stringify({
                type: 'file',
                userId,
                fileName,
                fileType,
                fileSize,
                data,
            }),
        );
    }

    getReceivedMessages(): Buffer[] {
        return [...this.messages];
    }

    onMessage(callback: (data: Buffer) => void): void {
        this.client.on('message', callback);
    }

    close(): void {
        if (this.client.readyState === WebSocket.OPEN || this.client.readyState === WebSocket.CONNECTING) {
            this.client.close();
        }
    }

    isConnected(): boolean {
        return this.connected && this.client.readyState === WebSocket.OPEN;
    }
}
