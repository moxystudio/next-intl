import NextIntlContext from './context';

const { Provider: NextIntlProvider, Consumer: NextIntlConsumer } = NextIntlContext;

export { NextIntlContext, NextIntlProvider, NextIntlConsumer };
export { default as useNextIntl } from './hook';
export { default as NextIntlScript } from './script';
