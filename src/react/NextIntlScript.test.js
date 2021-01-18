import React from 'react';
import { render } from '@testing-library/react';
import NextIntlScript from './NextIntlScript';

beforeEach(() => {
    global.__NEXT_INTL_POLYFILLS__ = [
        {
            asset: 'intl-polyfill-1.js',
            shouldPolyfill: 'exports.shouldPolyfill = () => true',
        },
        {
            asset: 'intl-polyfill-2.js',
            shouldPolyfill: 'exports.shouldPolyfill = () => false',
        },
    ];
});

afterEach(() => {
    console.error.mockRestore?.();
});

it('should render a script tag with conditional loading for each polyfill correctly', () => {
    const { container } = render(
        <NextIntlScript />,
    );

    const script = container.querySelector('script');

    expect(script.innerHTML).toMatchSnapshot();
});

it('should throw if unable to find polyfill chunk', () => {
    delete global.__NEXT_INTL_POLYFILLS__;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
        render(
            <NextIntlScript />,
        );
    }).toThrow(new Error('Could not locale polyfills data, did you forgot to enable the plugin in the next.config.js file?'));
});
