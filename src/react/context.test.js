import React from 'react';
import { FormattedMessage } from 'react-intl';
import { render } from '@testing-library/react';
import NextIntlContext from './context';
import createManager from '../manager';

jest.mock('../manager', () => jest.fn((...args) => {
    const createManager = jest.requireActual('../manager').default;
    const manager = createManager(...args);

    jest.spyOn(manager, 'destroy');

    return manager;
}));

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
    createManager.mockClear();
    console.error.mockRestore?.();
});

it('should setup IntlProvider with the correct locale and messages', () => {
    const { queryByText } = render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }>
            <FormattedMessage id="apple" />
        </NextIntlContext.Provider>,
    );

    const appleMessage = messages[initialData.localeId].apple;

    expect(queryByText(appleMessage)).toBeDefined();
});

it('should pass any extraneous props to IntlProvider', () => {
    const { container } = render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }
            textComponent={ 'p' }>
            <FormattedMessage id="apple" />
        </NextIntlContext.Provider>,
    );

    const appleMessage = messages[initialData.localeId].apple;

    const element = container.querySelector('p');

    expect(element).toBeDefined();
    expect(element.textContent).toBe(appleMessage);
});

it('should reconstruct the manager each time the policies change', () => {
    const { rerender } = render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData } />,
    );

    const newPolicies = [
        { match: () => locales[0].id },
    ];

    rerender(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ newPolicies }
            initialData={ initialData } />,
    );

    expect(createManager).toHaveBeenCalledTimes(2);
});

it('should fail if locales changed but current locale does not exist', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData } />,
    );

    const newLocales = locales.slice(0, 1);

    expect(() => {
        rerender(
            <NextIntlContext.Provider
                locales={ newLocales }
                policies={ policies }
                initialData={ initialData } />,
        );
    }).toThrow(/Unknown locale id: pt-PT/);
});

it('should rerender when locale changes', async () => {
    const { queryByText } = render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }>
            <FormattedMessage id="apple" />
        </NextIntlContext.Provider>,
    );

    const manager = createManager.mock.results[0].value;

    await manager.changeLocale('ru-RU');

    const appleMessage = messages['ru-RU'].apple;

    expect(queryByText(appleMessage)).toBeDefined();
});

it('should destroy the manager when unmounted', () => {
    const { unmount } = render(
        <NextIntlContext.Provider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }>
            <FormattedMessage id="apple" />
        </NextIntlContext.Provider>,
    );

    unmount();

    const manager = createManager.mock.results[0].value;

    expect(manager.destroy).toHaveBeenCalledTimes(1);
});
