import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

declare const expect: jest.Expect;

// Mock WebSocket
class MockWebSocket implements WebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    binaryType: BinaryType = 'blob';
    bufferedAmount = 0;
    extensions = '';
    protocol = '';
    readyState = MockWebSocket.CONNECTING;
    url: string;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    private static instances: MockWebSocket[] = [];

    constructor(url: string, _protocols?: string | string[]) {
        this.url = url;
        MockWebSocket.instances.push(this);

        // Simulate connection opening
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 10);
    }

    send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        // Mock send implementation
    }

    close(code?: number, reason?: string) {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent('close', { code, reason }));
        }
    }

    addEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: (event: WebSocketEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        _type: string,
        _listener: EventListenerOrEventListenerObject,
        _options?: boolean | AddEventListenerOptions,
    ): void {
        // Mock implementation
    }

    removeEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: (event: WebSocketEventMap[K]) => void,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        _type: string,
        _listener: EventListenerOrEventListenerObject,
        _options?: boolean | EventListenerOptions,
    ): void {
        // Mock implementation
    }

    dispatchEvent(_event: Event): boolean {
        return true;
    }

    static getLastInstance(): MockWebSocket | undefined {
        return MockWebSocket.instances[MockWebSocket.instances.length - 1];
    }

    static reset() {
        MockWebSocket.instances = [];
    }

    simulateMessage(data: string) {
        if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { data }));
        }
    }
}

// Replace global WebSocket with mock
Object.defineProperty(global, 'WebSocket', {
    writable: true,
    value: MockWebSocket,
});

describe('useWebSocket', () => {
    beforeEach(() => {
        MockWebSocket.reset();
        jest.clearAllMocks();
    });

    it('should connect to WebSocket server on mount', async () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost:8080' }));

        await waitFor(() => {
            expect(result.current.isConnected).toBe(true);
        });
    });

    it('should be disconnected initially', () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost:8080' }));

        expect(result.current.isConnected).toBe(false);
    });

    it('should send chat message', async () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost:8080' }));

        await waitFor(() => {
            expect(result.current.isConnected).toBe(true);
        });

        const mockSend = jest.fn();
        const ws = MockWebSocket.getLastInstance();
        if (ws) {
            ws.send = mockSend;
        }

        result.current.sendMessage({
            userId: 'user-123',
            content: 'Hello, world!',
        });

        await waitFor(() => {
            expect(mockSend).toHaveBeenCalledTimes(1);
            const sentData = JSON.parse(mockSend.mock.calls[0][0]);
            expect(sentData.type).toBe('chat');
            expect(sentData.userId).toBe('user-123');
            expect(sentData.content).toBe('Hello, world!');
        });
    });

    it('should send file upload message', async () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost:8080' }));

        await waitFor(() => {
            expect(result.current.isConnected).toBe(true);
        });

        const mockSend = jest.fn();
        const ws = MockWebSocket.getLastInstance();
        if (ws) {
            ws.send = mockSend;
        }

        result.current.sendFile({
            userId: 'user-123',
            fileName: 'test.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            data: 'base64data',
        });

        await waitFor(() => {
            expect(mockSend).toHaveBeenCalledTimes(1);
            const sentData = JSON.parse(mockSend.mock.calls[0][0]);
            expect(sentData.type).toBe('file');
            expect(sentData.userId).toBe('user-123');
            expect(sentData.fileName).toBe('test.pdf');
        });
    });

    it('should receive messages', async () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost:8080' }));

        await waitFor(() => {
            expect(result.current.isConnected).toBe(true);
        });

        const onMessage = jest.fn();
        result.current.onMessage(onMessage);

        const ws = MockWebSocket.getLastInstance();
        if (ws) {
            ws.simulateMessage(
                JSON.stringify({
                    id: 'msg-123',
                    userId: 'user-123',
                    content: 'Hello, world!',
                    type: 'message',
                    timestamp: new Date().toISOString(),
                }),
            );
        }

        await waitFor(() => {
            expect(onMessage).toHaveBeenCalledTimes(1);
            expect(onMessage.mock.calls[0][0].content).toBe('Hello, world!');
        });
    });

    it('should handle disconnection', async () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost:8080' }));

        await waitFor(() => {
            expect(result.current.isConnected).toBe(true);
        });

        const ws = MockWebSocket.getLastInstance();
        if (ws) {
            ws.close();
        }

        await waitFor(() => {
            expect(result.current.isConnected).toBe(false);
        });
    });
});
