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

it('should copy statics', () => {
    const MyApp = () => null;

    MyApp.foo = 'bar';

    const EnhancedMyApp = withIntlApp(() => ({}))(MyApp);

    expect(EnhancedMyApp.foo).toBe('bar');
});
