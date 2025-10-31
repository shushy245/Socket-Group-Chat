import React from 'react';
import '@testing-library/jest-dom';
import { within, screen, render, waitFor, waitForOptions, fireEvent, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitForNextTick } from '../utils/waitForNextTick';

declare const expect: jest.Expect;

class CustomError extends Error {
    constructor(public customError: string, private additionalError?: Error | CustomError | unknown) {
        let additionalErrorMessage = '';
        if (additionalError instanceof CustomError) {
            additionalErrorMessage = additionalError.message;
        } else if (additionalError instanceof Error) {
            additionalErrorMessage = additionalError.message?.split(/(?:Ignored nodes:|<html)/)[0];
        }

        const message = `${customError} - \n\n${additionalErrorMessage}`;
        super(message);
    }
}

const dataYellowTestId = (tid: any) => `\x1b[33m[data-testid="${tid}"]\x1b[0m`;
const elementBlueName = (text: any) => `\x1b[34m${text}\x1b[0m`;
const errorRedText = (text: any) => `\x1b[1m\x1b[31m${text}\x1b[0m`;
const expectedGreenText = (text: any) => `\x1b[32m${text}\x1b[0m`;
const assertMagentaText = (text: string) => `\x1b[35m${text}\x1b[0m`;

export abstract class JestDriver<PropsT extends object> {
    protected props: Partial<PropsT> = {};
    protected testId?: string;

    public get testIdValue() {
        if (!this.testId) {
            throw new Error('when driver used as testkit(child driver), `testId` is required');
        }
        return this.testId;
    }

    constructor({ testId }: { testId?: string } = {}) {
        this.testId = testId;
    }

    private exists = ({
        testId,
        shouldExists = true,
        isGlobal = false,
        componentName = 'Element',
    }: {
        testId: string;
        shouldExists?: boolean;
        isGlobal?: boolean;
        componentName?: string;
    }) => {
        const isFocused = !isGlobal && this.testId;
        const element = isFocused ? this.getRoot() : screen;

        try {
            if (shouldExists) {
                expect(element.queryByTestId(testId)).toBeInTheDocument();
            } else {
                expect(element.queryByTestId(testId)).not.toBeInTheDocument();
            }
        } catch (_e) {
            const baseErrorMessage = `${elementBlueName(componentName)} with ${dataYellowTestId(
                testId,
            )} ${expectedGreenText('expected')} ${errorRedText(shouldExists ? 'To Exist' : 'Not To Exist')}`;
            if (isFocused) {
                throw new CustomError(`${baseErrorMessage} in the component with ${dataYellowTestId(this.testId!)}`);
            } else {
                throw new CustomError(baseErrorMessage);
            }
        }
    };

    public waitForNextTick = (ticks?: number) => waitForNextTick(ticks);

    protected getRoot = () => {
        if (this.testId) {
            return within(screen.getByTestId(this.testId));
        }
        return screen;
    };

    protected getScreen = () => {
        return screen;
    };

    protected getWrapper = (options: { isGlobal?: boolean; wrapperTestId?: string } = { isGlobal: false }) => {
        if (options.isGlobal) {
            return this.getScreen();
        } else if (options.wrapperTestId) {
            return within(screen.getByTestId(options.wrapperTestId));
        }
        return this.getRoot();
    };

    protected getByTestId = (
        testId: string,
        { exact, isGlobal }: { exact?: boolean; isGlobal?: boolean } = { exact: true, isGlobal: false },
    ) => this.getWrapper({ isGlobal }).getByTestId(testId, { exact });

    protected queryAllByTestId = (testId: string, { exact = false }: { exact?: boolean } = { exact: false }) =>
        this.getWrapper().queryAllByTestId(testId, { exact });

    protected getNullableByTestId = (testId: string) => this.getWrapper().queryByTestId(testId);

    public dumpHtmlForDebug = (byTestId?: string) =>
        screen.debug(byTestId ? screen.getByTestId(byTestId) : undefined, 100000);
    public focusedDumpHtmlForDebug = () => {
        if (this.testId) {
            screen.debug(screen.getByTestId(this.testId));
        } else {
            screen.debug();
        }
    };

    public waitFor = async (fn: () => unknown, options: waitForOptions & { withDump?: boolean } = {}) => {
        const { withDump = false, ...rest } = options;
        try {
            return await waitFor(fn, rest);
        } catch (error: unknown | CustomError) {
            if (error instanceof CustomError) {
                throw new CustomError(`${error.customError}`);
            } else if (error instanceof Error) {
                error.message = error.message?.split(/(?:Ignored nodes:|<html)/)[0];
                throw error;
            }

            throw error;
        } finally {
            if (withDump) {
                this.dumpHtmlForDebug();
            }
        }
    };

    protected createComponent = ({ Component }: { Component: React.FC<PropsT> }): any => {
        render(<Component {...(this.props as PropsT)} />);
        return this;
    };

    protected createHook = <T extends () => any>({ hookFn, hookArgs }: { hookFn: T; hookArgs?: Parameters<T> }) => {
        return renderHook(() => hookFn(...(hookArgs || [])));
    };

    protected get givenBase() {
        return {
            props: (props: Partial<PropsT>) => {
                this.props = { ...this.props, ...props };
                return this;
            },
        };
    }

    protected get getBase() {
        return {};
    }

    protected get whenBase() {
        return {};
    }

    protected get _whenBase() {
        return {
            clickOn: (testId: string, options?: { exact?: boolean; isGlobal?: boolean; wrapperTestId?: string }) =>
                userEvent.click(this.getByTestId(testId, options)),
            clickOnRoot: () => userEvent.click(screen.getByTestId(this.testIdValue)),
            mouseOver: (testId: string, options?: { exact?: boolean; isGlobal?: boolean }) =>
                fireEvent.mouseOver(this.getByTestId(testId, options)),
            upload: (testId: string, files: File[], options?: { exact?: boolean; isGlobal?: boolean }) =>
                userEvent.upload(this.getByTestId(testId, options), files),
            enterText: async (testId: string, text: string, options?: { exact?: boolean; isGlobal?: boolean }) => {
                if (text) {
                    await userEvent.clear(this.getByTestId(testId, options));
                    return userEvent.type(this.getByTestId(testId, options), text);
                } else {
                    return userEvent.clear(this.getByTestId(testId, options));
                }
            },
        };
    }

    protected get testkitsBase() {
        return {};
    }

    protected get assertBase() {
        return {
            isExists: (shouldExists: boolean = true) => {
                if (!this.testId) {
                    throw new Error('can only be used for testkits with "testId" supplied');
                }

                return this.exists({ testId: this.testId, shouldExists, isGlobal: true });
            },
            toHaveBeenCalled: {
                called: (mock: jest.Mock) => {
                    return expect(mock).toHaveBeenCalled();
                },
                times: (mock: jest.Mock, times: number) => {
                    return expect(mock).toHaveBeenCalledTimes(times);
                },
                with: (mock: jest.Mock, ...args: unknown[]) => {
                    return expect(mock).toHaveBeenCalledWith(...args);
                },
                not: async (mock: jest.Mock) => {
                    await Promise.resolve();
                    return expect(mock).not.toHaveBeenCalled();
                },
                eventually: (mock: jest.Mock) => {
                    return this.waitFor(() => this._assert.toHaveBeenCalled.called(mock));
                },
                timesEventually: (mock: jest.Mock, times: number) => {
                    return this.waitFor(() => this._assert.toHaveBeenCalled.times(mock, times));
                },
                withEventually: (mock: jest.Mock, ...args: unknown[]) => {
                    return this.waitFor(() => expect(mock).toHaveBeenCalledWith(...args));
                },
            },
            objectContaining: (object: object) => {
                return expect.objectContaining(object);
            },
        };
    }

    protected get _assertBase() {
        return {
            exists: (testId: string, shouldExists: boolean = true, { isGlobal }: { isGlobal?: boolean } = {}) => {
                return this.exists({ testId, shouldExists, isGlobal });
            },
            toastExists: (toastTestId: string, shouldExists: boolean = true) => {
                return this.exists({ testId: toastTestId, shouldExists, isGlobal: true, componentName: 'Toast' });
            },
            modalExists: (modalTestId: string, shouldExists: boolean = true) => {
                return this.exists({ testId: modalTestId, shouldExists, isGlobal: true, componentName: 'Modal' });
            },
            toastHasContent: (toastTestId: string, text: string | RegExp) => {
                expect(screen.getByTestId(toastTestId)).toHaveTextContent(text);
            },
            hasItemsCount: (testId: string, count: number) => {
                const items = this.queryAllByTestId(testId);
                try {
                    expect(items).toHaveLength(count);
                } catch (e) {
                    throw new CustomError(
                        `${assertMagentaText('Assert')} ${elementBlueName('Elements')} with ${dataYellowTestId(
                            testId,
                        )} to have length ${expectedGreenText(count)} but has ${errorRedText(items.length)} - \n\n${e}`,
                    );
                }
            },
            hasTextContent: (testId: string, text: string | RegExp, options?: { isGlobal?: boolean }) => {
                try {
                    expect(this.getByTestId(testId, options)).toHaveTextContent(text);
                } catch (e) {
                    throw new CustomError(
                        `${assertMagentaText('Assert')} ${elementBlueName('Element')} with ${dataYellowTestId(
                            testId,
                        )} to have content "${expectedGreenText(text)}"`,
                        e,
                    );
                }
            },
            hasAttributeValue: (
                testId: string,
                attribute: string,
                value: string,
                { isGlobal, hasAttribute = true }: { isGlobal?: boolean; hasAttribute?: boolean } = {},
            ) => {
                if (hasAttribute) {
                    expect(this.getByTestId(testId, { isGlobal })).toHaveAttribute(attribute, value);
                } else {
                    expect(this.getByTestId(testId, { isGlobal })).not.toHaveAttribute(attribute, value);
                }
            },
            hasAttributeAriaDisabled: (
                testId: string,
                isDisabled: boolean,
                { isGlobal }: { isGlobal?: boolean } = {},
            ) => {
                expect(this.getByTestId(testId, { isGlobal })).toHaveAttribute('aria-disabled', isDisabled.toString());
            },
            hasAttribute: (testId: string, attribute: string, hasAttribute: boolean = true) => {
                try {
                    if (hasAttribute) {
                        expect(this.getByTestId(testId)).toHaveAttribute(attribute);
                    } else {
                        expect(this.getByTestId(testId)).not.toHaveAttribute(attribute);
                    }
                } catch (e) {
                    throw new CustomError(
                        `${elementBlueName('Element')} with ${dataYellowTestId(testId)} ${expectedGreenText(
                            hasAttribute ? 'has' : 'not has',
                        )} attribute ${errorRedText(attribute)}`,
                        e,
                    );
                }
            },
        };
    }

    protected testkits = {
        ...this.testkitsBase,
    };

    protected _when = {
        ...this._whenBase,
        ...this.whenBase,
    };

    protected _assert = {
        ...this._assertBase,
        ...this.assertBase,
    };

    public given = {
        ...this.givenBase,
    };

    public get = {
        ...this.getBase,
    };

    public assert = {
        ...this.assertBase,
    };
}
