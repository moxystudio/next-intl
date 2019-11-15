import fs from 'fs';
import React from 'react';
import { render } from '@testing-library/react';
import NextIntlScript from './script';

jest.mock('fs', () => ({
    readFileSync: jest.fn(),
}));

beforeAll(() => {
    global.__webpack_public_path__ = '/_next/'; // eslint-disable-line
});

it('should render a script tag with conditional loading of the polyfill correctly', () => {
    fs.readFileSync.mockImplementation(() => (
        JSON.stringify({
            '@formatjs/intl-pluralrules/polyfill-locales': [
                { publicPath: 'static/chunks/intl-polyfill.js' },
            ],
        })),
    );

    const { container } = render(
        <NextIntlScript />,
    );

    const script = container.querySelector('script');

    expect(script.innerHTML).toMatchSnapshot();
});

it('should fail if unable to find polyfill chunk', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    fs.readFileSync.mockImplementation(() => '{}');

    expect(() => {
        render(
            <NextIntlScript />,
        );
    }).toThrow(new Error('Could not find intl-polyfill chunk in .next/react-loadable-manifest.json'));
});
