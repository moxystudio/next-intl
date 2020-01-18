import React from 'react';
import { render } from '@testing-library/react';
import NextIntlScript from './NextIntlScript';

beforeEach(() => {
    global.__NEXT_INTL_POLYFILL_URL__ = 'intl-polyfill.js';
});

afterEach(() => {
    console.error.mockRestore?.();
});

it('should render a script tag with conditional loading of the polyfill correctly', () => {
    const { container } = render(
        <NextIntlScript />,
    );

    const script = container.querySelector('script');

    expect(script.innerHTML).toMatchSnapshot();
});

it('should fail if unable to find polyfill chunk', () => {
    delete global.__NEXT_INTL_POLYFILL_URL__;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
        render(
            <NextIntlScript />,
        );
    }).toThrow(new Error('Could not locale the polyfill URL, did you forgot to enable the plugin in the next.config.js file?'));
});
