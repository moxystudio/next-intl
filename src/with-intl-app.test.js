import React from 'react';
import { FormattedMessage } from 'react-intl';
import { render, screen } from '@testing-library/react';
import withIntlApp from './with-intl-app';

jest.mock('next/router', () => ({
    useRouter: jest.fn(() => ({ locale: 'en' })),
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

it('should setup IntlProvider', async () => {
    const props = {
        pageProps: {
            intl: {
                messages: {
                    apple: 'Apple',
                },
            },
        },
    };

    const MyApp = () => <FormattedMessage id="apple" />;
    const EnhancedMyApp = withIntlApp(() => props.pageProps.intl.messages)(MyApp);

    render(<EnhancedMyApp { ...props } />);

    screen.getByText('Apple');
});

it('should remove "intl" from page props', async () => {
    const props = {
        pageProps: {
            intl: {
                messages: {
                    apple: 'Apple',
                },
            },
        },
    };

    const MyApp = jest.fn(() => <FormattedMessage id="apple" />);
    const EnhancedMyApp = withIntlApp(() => props.pageProps.intl.messages)(MyApp);

    render(<EnhancedMyApp { ...props } foo="bar" />);

    expect(MyApp).toHaveBeenCalledTimes(1);
    expect(MyApp).toHaveBeenCalledWith({ pageProps: {}, foo: 'bar' }, {});
});

it('should copy statics', () => {
    const MyApp = () => null;

    MyApp.foo = 'bar';

    const EnhancedMyApp = withIntlApp(() => ({}))(MyApp);

    expect(EnhancedMyApp.foo).toBe('bar');
});

it('should error out if page did not use "getIntlProps()"', () => {
    const props = {
        pageProps: {},
    };

    const MyApp = jest.fn(() => <FormattedMessage id="apple" />);
    const EnhancedMyApp = withIntlApp(() => ({}))(MyApp);

    expect(() => {
        render(<EnhancedMyApp { ...props } />);
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

    const MyApp = jest.fn(() => <FormattedMessage id="apple" />);
    const EnhancedMyApp = withIntlApp(() => ({}))(MyApp);

    const { rerender } = render(<EnhancedMyApp { ...props } />);

    rerender(<EnhancedMyApp pageProps={ { statusCode: 500 } } />);
    rerender(<EnhancedMyApp pageProps={ { statusCode: undefined } } />);
});
