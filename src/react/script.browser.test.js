import React from 'react';
import { render } from '@testing-library/react';
import NextIntlScript from './script.browser';

it('should render nothing', () => {
    const { container } = render(
        <NextIntlScript />,
    );

    expect(container.childNodes).toHaveLength(0);
});
