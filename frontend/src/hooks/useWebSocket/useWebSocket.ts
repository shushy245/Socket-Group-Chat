import { useEffect, useRef, useState, useCallback } from 'react';
import { Message, MessageType } from '@chat-mvp/common/types/message';

export interface ChatMessage {
    userId: string;
    content: string;
}

export interface FileUploadMessage {
    userId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    data: string; // Base64 encoded
}

export interface UseWebSocketOptions {
    url: string;
}

export interface UseWebSocketReturn {
    isConnected: boolean;
    sendMessage: (message: ChatMessage) => void;
    sendFile: (file: FileUploadMessage) => void;
    onMessage: (callback: (message: Message) => void) => void;
    disconnect: () => void;
}

export function useWebSocket({ url }: UseWebSocketOptions): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const messageCallbackRef = useRef<((message: Message) => void) | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            };

            ws.onclose = () => {
                setIsConnected(false);

                // Auto-reconnect with exponential backoff (max 5 attempts)
                if (reconnectAttemptsRef.current < 5) {
                    const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const message: Message = {
                        ...data,
                        type: data.type === 'message' ? MessageType.Message : MessageType.File,
                        timestamp: new Date(data.timestamp),
                    };
                    if (messageCallbackRef.current) {
                        messageCallbackRef.current(message);
                    }
                } catch (_error) {
                    // Ignore malformed messages
                }
            };

            ws.onerror = () => {
                // Error handling is done via onclose
            };
        } catch (_error) {
            // Connection failed
            setIsConnected(false);
        }
    }, [url]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((message: ChatMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'chat',
                    userId: message.userId,
                    content: message.content,
                }),
            );
        }
    }, []);

    const sendFile = useCallback((file: FileUploadMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'file',
                    userId: file.userId,
                    fileName: file.fileName,
                    fileType: file.fileType,
                    fileSize: file.fileSize,
                    data: file.data,
                }),
            );
        }
    }, []);

    const onMessage = useCallback((callback: (message: Message) => void) => {
        messageCallbackRef.current = callback;
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttemptsRef.current = 5; // Prevent reconnection
        if (wsRef.current) {
            wsRef.current.close();
        }
    }, []);

    return {
        isConnected,
        sendMessage,
        sendFile,
        onMessage,
        disconnect,
    };
}
