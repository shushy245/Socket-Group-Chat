export async function waitForNextTick(ticks: number = 1): Promise<void> {
    for (let i = 0; i < ticks; i++) {
        await Promise.resolve();
    }
}
