export function aChatMessage() {
    const message = {
        type: 'chat',
        userId: 'user-123',
        content: 'Hello, world!',
    };

    const builder = {
        build: () => ({ ...message }),
        withUserId(userId: string) {
            message.userId = userId;
            return builder;
        },
        withContent(content: string) {
            message.content = content;
            return builder;
        },
    };

    return builder;
}

export function aFileMessage() {
    const message = {
        type: 'file',
        userId: 'user-123',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        data: 'base64data',
    };

    const builder = {
        build: () => ({ ...message }),
        withUserId(userId: string) {
            message.userId = userId;
            return builder;
        },
        withFileName(fileName: string) {
            message.fileName = fileName;
            return builder;
        },
        withFileType(fileType: string) {
            message.fileType = fileType;
            return builder;
        },
        withFileSize(fileSize: number) {
            message.fileSize = fileSize;
            return builder;
        },
        withData(data: string) {
            message.data = data;
            return builder;
        },
    };

    return builder;
}
