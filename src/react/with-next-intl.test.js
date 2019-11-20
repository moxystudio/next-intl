import React, { Component, createRef } from 'react';
import { render } from '@testing-library/react';
import NextIntlProvider from './NextIntlProvider';
import withNextIntl from './with-next-intl';

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

it('should inject the nextIntl prop with the current provider value', () => {
    expect.assertions(1);

    const MyComponent = withNextIntl(({ nextIntl }) => {
        expect(nextIntl).toEqual(
            expect.objectContaining({
                locale: expect.any(Object),
                locales: expect.any(Array),
                changeLocale: expect.any(Function),
                intl: expect.any(Object),
            }),
        );

        return null;
    });

    render(
        <NextIntlProvider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }>
            <MyComponent />
        </NextIntlProvider>,
    );
});

it('should forward refs', () => {
    class MyComponent extends Component {
        render() {
            return null;
        }

        handleClick = () => {};
    }

    const EnhancedMyComponent = withNextIntl(MyComponent);

    const ref = createRef();

    render(
        <NextIntlProvider
            locales={ locales }
            policies={ policies }
            initialData={ initialData }>
            <EnhancedMyComponent ref={ ref } />
        </NextIntlProvider>,
    );

    expect(ref.current.handleClick).toBeDefined();
});

it('should copy statics', () => {
    const MyComponent = () => {};

    MyComponent.foo = 'bar';

    const EnhancedMyComponent = withNextIntl(MyComponent);

    expect(EnhancedMyComponent.foo).toBe('bar');
});
