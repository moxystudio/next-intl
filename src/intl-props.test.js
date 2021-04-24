import React from 'react';
import { useRouter } from 'next/router';
import { render } from '@testing-library/react';
import { getIntlProps, useIntlProps, setLocaleLoader, clearCache } from './intl-props';

jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
    jest.resetModules();

    clearCache();

    useRouter.mockImplementation(() => ({
        locale: 'en',
        defaultLocale: 'en',
    }));
});

describe('getIntlProps()', () => {
    it('should throw if no locale loader was set', async () => {
        await expect(getIntlProps('en')).rejects.toEqual(
            new Error('No loadLocale() function configured. Did you forget to wrap your app using withIntlApp()?'),
        );
    });

    it('should throw if no locale loader returns nullish', async () => {
        setLocaleLoader(() => null);

        await expect(getIntlProps('en')).rejects.toEqual(
            new Error('Expecting loadLocale() to return a messages object'),
        );
    });

    it('should call locale loader and return an object with a "intl" key', async () => {
        const loadLocale = jest.fn(async () => ({ foo: 'bar' }));

        setLocaleLoader(loadLocale);

        const props = await getIntlProps('en');

        expect(loadLocale).toHaveBeenCalledTimes(1);
        expect(loadLocale).toHaveBeenCalledWith('en');

        expect(props).toEqual({
            intl: {
                messages: { foo: 'bar' },
            },
        });
    });

    it('should use cache if possible on client-side', async () => {
        const loadLocale = jest.fn(async () => ({ apple: 'Maça' }));

        setLocaleLoader(loadLocale);

        const MyComponent = (props) => {
            useIntlProps(props);

            return 'foo';
        };

        const props1 = await getIntlProps('en');

        render(
            <MyComponent pageProps={ {
                intl: {
                    messages: {
                        apple: 'Maça',
                    },
                },
            } } />,
        );

        const props2 = await getIntlProps('en');

        expect(loadLocale).toHaveBeenCalledTimes(1);
        expect(loadLocale).toHaveBeenCalledWith('en');

        expect(props1).toEqual({
            intl: {
                messages: {
                    apple: 'Maça',
                },
            },
        });
        expect(props2).toEqual({
            intl: {
                messages: {
                    apple: 'Maça',
                },
            },
        });
    });
});

describe('useIntlProps()', () => {
    it('should return the correct data (when intl is in pageProps)', async () => {
        const props = {
            foo: 'bar',
            pageProps: {
                foz: 'baz',
                intl: {
                    messages: {
                        apple: 'Apple',
                    },
                },
            },
        };

        const data = [];
        const MyComponent = (props) => {
            const result = useIntlProps(props);

            data.push(result);

            return 'foo';
        };

        render(<MyComponent { ...props } />);

        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            locale: 'en',
            defaultLocale: 'en',
            messages: {
                apple: 'Apple',
            },
            modifiedProps: {
                foo: 'bar',
                pageProps: {
                    foz: 'baz',
                },
            },
        });
    });

    it('should return the correct data (when intl is in props)', async () => {
        const props = {
            foo: 'bar',
            intl: {
                messages: {
                    apple: 'Apple',
                },
            },
            pageProps: {
                foz: 'baz',
            },
        };

        const data = [];
        const MyComponent = (props) => {
            const result = useIntlProps(props);

            data.push(result);

            return 'foo';
        };

        render(<MyComponent { ...props } />);

        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            locale: 'en',
            defaultLocale: 'en',
            messages: {
                apple: 'Apple',
            },
            modifiedProps: {
                foo: 'bar',
                pageProps: {
                    foz: 'baz',
                },
            },
        });
    });

    it('should error out if "intl" was not found in pageProps / props', () => {
        const props = {
            pageProps: {},
        };

        const MyComponent = (props) => {
            useIntlProps(props);

            return 'foo';
        };

        expect(() => {
            render(<MyComponent { ...props } />);
        }).toThrow(/could not find "intl" prop/i);
    });

    it('should use cached props when rendering error pages', () => {
        const props = {
            pageProps: {
                intl: {
                    messages: {
                        apple: 'Apple',
                    },
                },
            },
        };

        const data = [];
        const MyComponent = (props) => {
            const data_ = useIntlProps(props);

            data.push(data_);

            return 'foo';
        };

        const err = new Error('foo');

        render(<MyComponent { ...props } />);
        render(<MyComponent err={ err } />);

        expect(data).toHaveLength(2);
        expect(data[0]).toEqual({
            locale: 'en',
            defaultLocale: 'en',
            messages: {
                apple: 'Apple',
            },
            modifiedProps: {
                pageProps: {},
            },
        });
        expect(data[1]).toEqual({
            ...data[0],
            modifiedProps: {
                err,
                ...data[0].modifiedProps,
            },
        });
    });
});
