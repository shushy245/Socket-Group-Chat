import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket/useWebSocket';
import { encodeFile, decodeBase64ToBlob } from '../utils/base64';
import { validateFileSize, validateFileNotEmpty, MAX_FILE_SIZE } from '../utils/fileValidation';
import styles from './ChatPage.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

import { Message, MessageType } from '@chat-mvp/common/types/message';
import { Job, JobStatus, JobType } from '@chat-mvp/common/types/job';

export function ChatPage() {
    const [userId] = useState(() => `user-${Math.random().toString(36).substring(7)}`);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [jobs, setJobs] = useState<Record<string, Job>>({});
    const [error, setError] = useState<string | null>(null);
    const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});
    const { isConnected, sendMessage, sendFile, onMessage } = useWebSocket({ url: WS_URL });

    useEffect(() => {
        onMessage((msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });
    }, [onMessage]);

    const handleSendMessage = () => {
        if (!message.trim()) {
            return;
        }

        sendMessage({
            userId,
            content: message,
        });

        setMessage('');
    };

    useEffect(() => {
        /** Start polling for pending/processing jobs */
        Object.keys(jobs).forEach((jobId) => {
            const job = jobs[jobId];
            /** Only create interval if job is pending/processing and we don't already have one */
            if (
                (job.status === JobStatus.Pending || job.status === JobStatus.Processing) &&
                !intervalRefs.current[jobId]
            ) {
                intervalRefs.current[jobId] = setInterval(async () => {
                    const statusResponse = await fetch(`${API_URL}/jobs/${jobId}`);
                    if (statusResponse.ok) {
                        const updatedJob: Job = await statusResponse.json();
                        setJobs((prev) => ({ ...prev, [jobId]: updatedJob }));

                        /** Stop polling when job is complete or failed */
                        if (updatedJob.status === JobStatus.Completed || updatedJob.status === JobStatus.Failed) {
                            if (intervalRefs.current[jobId]) {
                                clearInterval(intervalRefs.current[jobId]);
                                delete intervalRefs.current[jobId];
                            }
                        }
                    }
                }, 500);
            }
        });

        /** Cleanup: stop polling for jobs that are no longer in state or have completed */
        Object.keys(intervalRefs.current).forEach((jobId) => {
            const job = jobs[jobId];
            if (!job || job.status === JobStatus.Completed || job.status === JobStatus.Failed) {
                if (intervalRefs.current[jobId]) {
                    clearInterval(intervalRefs.current[jobId]);
                    delete intervalRefs.current[jobId];
                }
            }
        });

        /** Cleanup all intervals on unmount */
        return () => {
            Object.values(intervalRefs.current).forEach((intervalId) => {
                clearInterval(intervalId);
            });
            intervalRefs.current = {};
        };
    }, [jobs]);

    const createFileUploadPayload = async (file: File) => {
        const base64 = await encodeFile(file);
        return {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            data: base64,
        };
    };

    const createFileUploadJob = async (payload: {
        fileName: string;
        fileType: string;
        fileSize: number;
        data: string;
    }) => {
        const jobResponse = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: JobType.FileUpload,
                payload,
            }),
        });

        const job: Job = await jobResponse.json();
        setJobs((prev) => ({ ...prev, [job.id]: job }));
        return job;
    };

    const sendFileToWebSocket = (payload: { fileName: string; fileType: string; fileSize: number; data: string }) => {
        sendFile({
            userId,
            ...payload,
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setError(null);

        const sizeError = validateFileSize(file, MAX_FILE_SIZE);
        if (sizeError) {
            setError(sizeError);
            event.target.value = '';
            return;
        }

        const emptyError = validateFileNotEmpty(file);
        if (emptyError) {
            setError(emptyError);
            event.target.value = '';
            return;
        }

        try {
            const payload = await createFileUploadPayload(file);
            await createFileUploadJob(payload);
            sendFileToWebSocket(payload);
        } catch (error) {
            console.error('Failed to upload file:', error);
            setError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        event.target.value = '';
    };

    const handleFileDownload = (msg: Message) => {
        if (!msg.fileData) {
            setError('File data is missing');
            return;
        }

        try {
            if (!msg.fileData.data || msg.fileData.data.length === 0) {
                setError('Cannot download empty file');
                return;
            }

            if (!msg.fileData.fileName || !msg.fileData.fileType) {
                setError('File metadata is incomplete');
                return;
            }

            const blob = decodeBase64ToBlob(msg.fileData.data, msg.fileData.fileType);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = msg.fileData.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download file:', error);
            setError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Real-Time Chat MVP</h1>
            <div className={styles.userInfo}>
                <strong>User ID:</strong> {userId}
            </div>
            <div className={styles.connection}>
                <strong>Connection:</strong>{' '}
                <span className={isConnected ? styles.connected : styles.disconnected}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.messagesContainer}>
                <h3>Messages</h3>
                {messages.length === 0 ? (
                    <div>No messages yet...</div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={styles.messageItem}>
                            <div className={styles.messageContent}>
                                <strong>{msg.userId}:</strong> {msg.content}
                            </div>
                            {msg.type === MessageType.File && msg.fileData && (
                                <div className={styles.fileInfo}>
                                    <button
                                        onClick={() => handleFileDownload(msg)}
                                        className={styles.fileDownloadButton}
                                    >
                                        📎 {msg.fileData.fileName} ({msg.fileData.fileSize} bytes)
                                    </button>
                                </div>
                            )}
                            <div className={styles.timestamp}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className={styles.messageInput}
                    disabled={!isConnected}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!isConnected || !message.trim()}
                    className={styles.sendButton}
                >
                    Send
                </button>
            </div>

            <div className={styles.fileUploadContainer}>
                <input type="file" onChange={handleFileUpload} disabled={!isConnected} className={styles.fileInput} />
            </div>

            {Object.keys(jobs).length > 0 && (
                <div className={styles.jobsContainer}>
                    <h3>Job Status</h3>
                    {Object.values(jobs).map((job) => (
                        <div key={job.id} className={styles.jobItem}>
                            <div>
                                <strong>Job {job.id.substring(0, 8)}:</strong> {job.status} ({job.type})
                            </div>
                            {job.result && <div className={styles.jobResult}>Result: {job.result.message}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
