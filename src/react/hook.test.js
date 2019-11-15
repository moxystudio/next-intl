import React from 'react';
import { render } from '@testing-library/react';
import NextIntlContext from './context';
import useNextIntl from './hook';

const messages = {
    'en-US': { apple: 'apple' },
    'pt-PT': { apple: 'maça' },
    'ru-RU': { apple: 'яблоко' },
};

const locales = [
    { id: 'en-US', name: 'English', loadMessages: () => messages['en-US'] },
    { id: 'pt-PT', name: 'Português', loadMessages: () => messages['pt-PT'] },
    { id: 'ru-RU', name: 'русский', loadMessages: () => messages['ru-RU'] },
];

const policies = [
    { match: () => locales[0].id },
    { match: () => locales[1].id },
];

const initialData = {
    localeId: locales[1].id,
    messages: messages[locales[1].id],
};

afterEach(() => {
    console.error.mockRestore?.();
});

it('should setup IntlProvider with the correct locale and messages', () => {
    expect.assertions(1);

    const MyComponent = () => {
        const nextIntl = useNextIntl();

        expect(nextIntl).toEqual(
            expect.objectContaining({
                locale: expect.any(Object),
                locales: expect.any(Array),
                changeLocale: expect.any(Function),
            }),
        );

        return null;
    };

    render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }>
            <MyComponent />
        </NextIntlContext.Provider>,
    );
});
