import { MessageType } from '../../src/models/message';
import { aMessage } from '../builders/message';

declare const expect: jest.Expect;

describe('Message Model', () => {
    it('should create a text message', () => {
        const message = aMessage().withId('msg-123').withUserId('user-123').asChatMessage().build();

        expect(message.id).toBe('msg-123');
        expect(message.userId).toBe('user-123');
        expect(message.content).toBe('Hello, world!');
        expect(message.type).toBe(MessageType.Message);
    });

    it('should create a file message', () => {
        const message = aMessage()
            .withId('msg-123')
            .withUserId('user-123')
            .asFile('document.pdf', 'application/pdf', 1024)
            .build();

        expect(message.type).toBe(MessageType.File);
        expect(message.fileData).toBeDefined();
        expect(message.fileData?.fileName).toBe('document.pdf');
    });

    it('should serialize to JSON', () => {
        const message = aMessage()
            .withId('msg-123')
            .withUserId('user-123')
            .asChatMessage()
            .withTimestamp(new Date('2024-01-01T12:00:00Z'))
            .build();

        const json = JSON.stringify(message);
        const parsed = JSON.parse(json);

        expect(parsed.id).toBe('msg-123');
        expect(parsed.content).toBe('Hello, world!');
        expect(parsed.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should deserialize from JSON', () => {
        const json = {
            id: 'msg-123',
            userId: 'user-123',
            content: 'Hello, world!',
            type: MessageType.Message,
            timestamp: '2024-01-01T12:00:00.000Z',
        };

        const message = JSON.parse(JSON.stringify(json));
        message.timestamp = new Date(message.timestamp);

        expect(message.id).toBe('msg-123');
        expect(message.timestamp).toBeInstanceOf(Date);
    });
});
