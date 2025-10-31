import { Store } from '../../../src/store/store';
import { MessageType } from '../../../src/models/message';

export class StoreDriver {
    private store: Store;

    constructor(store: Store) {
        this.store = store;
    }

    getMessages() {
        return this.store.listMessages();
    }

    getMessageCount() {
        return this.store.listMessages().length;
    }

    hasMessageWithContent(content: string) {
        const messages = this.store.listMessages();
        return messages.some((msg) => msg.content === content);
    }

    hasMessageWithType(type: MessageType) {
        const messages = this.store.listMessages();
        return messages.some((msg) => msg.type === type);
    }

    hasMessageWithFileName(fileName: string) {
        const messages = this.store.listMessages();
        return messages.some((msg) => msg.type === MessageType.File && msg.fileData?.fileName === fileName);
    }
}
