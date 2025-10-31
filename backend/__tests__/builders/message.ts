import { Message, MessageType, FileData } from '../../src/models/message';
import { v4 as uuidv4 } from 'uuid';

export function aMessage() {
    const now = new Date();
    const message: Message = {
        id: uuidv4(),
        userId: 'user-123',
        content: 'Hello, world!',
        type: MessageType.Message,
        timestamp: now,
    };

    const builder = {
        build: (): Message => ({ ...message }),
        withId(id: string) {
            message.id = id;
            return builder;
        },
        withUserId(userId: string) {
            message.userId = userId;
            return builder;
        },
        withContent(content: string) {
            message.content = content;
            return builder;
        },
        withType(type: MessageType) {
            message.type = type;
            return builder;
        },
        withFileData(fileData: FileData) {
            message.fileData = fileData;
            return builder;
        },
        withTimestamp(timestamp: Date) {
            message.timestamp = timestamp;
            return builder;
        },
        asFile(fileName: string = 'test.pdf', fileType: string = 'application/pdf', fileSize: number = 1024) {
            message.type = MessageType.File;
            message.content = fileName;
            message.fileData = {
                fileName,
                fileType,
                fileSize,
                data: 'base64data',
            };
            return builder;
        },
        asChatMessage(content: string = 'Hello, world!') {
            message.type = MessageType.Message;
            message.content = content;
            message.fileData = undefined;
            return builder;
        },
    };

    return builder;
}
