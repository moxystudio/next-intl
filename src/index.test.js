import withIntlApp from './with-intl-app';
import { getIntlProps } from './intl-props';
import * as api from '.';

it('should export the correct API', () => {
    expect(api).toEqual({
        withIntlApp,
        getIntlProps,
    });
});
