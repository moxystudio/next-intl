# next-intl

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][build-status-image]][build-status-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

[npm-url]:https://npmjs.org/package/@moxy/next-intl
[downloads-image]:https://img.shields.io/npm/dm/@moxy/next-intl.svg
[npm-image]:https://img.shields.io/npm/v/@moxy/next-intl.svg
[build-status-url]:https://github.com/moxystudio/next-intl/actions
[build-status-image]:https://img.shields.io/github/workflow/status/moxystudio/next-intl/Node%20CI/master
[codecov-url]:https://codecov.io/gh/moxystudio/next-intl
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/next-intl/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/next-intl
[david-dm-image]:https://img.shields.io/david/moxystudio/next-intl.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/next-intl?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/next-intl.svg

Library to integrate [`react-intl`](https://www.npmjs.com/package/react-intl) with Next.js.

## Installation

```sh
$ npm install --save @moxy/next-intl react-intl
```

> ℹ️ If you are running Node.js `< 13.1.0`, you must also install `full-icu` and start node with [`--icu-data-dir=node_modules/full-icu`](https://github.com/zeit/next.js/blob/5e6f79117fae59ec3a6a3260808f611862c53f0a/examples/with-react-intl/package.json#L5) or use `NODE_ICU_DATA=node_modules/full-icu`.

## Setup

### 1. Configure `next.config.js`

Please configure `i18n` as explained in the official Next.js [docs](https://nextjs.org/docs/advanced-features/i18n-routing#getting-started).

```js
// next.config.js
module.exports = {
    i18n: {
        locales: ['en', 'pt'],
        defaultLocale: 'en',
    },
};
```

### 2. Create a root folder named `intl` to hold translation files:

```
intl/
    en.json
    pt.json
```

The `intl/en.json` file contains the messages for the `en` locale, like so:

```json
{
    "hello": "Hello World"
}
```

### 3. Wrap your app with `withIntlApp` in `pages/_app.js`:

```js
// pages/_app.js
import React from 'react';
import App from 'next/app';
import { withIntlApp } from '@moxy/next-intl';

// The example below dynamically downloads translations from your JSON files,
// but you may load them from external sources, such as a CMS.
// Please note that the result will be cached on the client-side,
// to avoid fetching translations on every page change.
const loadLocale = async (locale) => {
    const module = await import(/* webpackChunkName: "intl-messages" */ `../intl/${locale}.json`);

    return module.default;
};

export default withIntlApp(loadLocale)(App);
```

Here's an example if you have a custom app:

```js
import React from 'react';
import { withIntlApp } from '@moxy/next-intl';
import Layout from '../components/layout';

const MyApp = ({ Component, pageProps }) => (
    <Layout>
        <Component { ...pageProps } />
    </Layout>
);

const loadLocale = async (locale) => {
    const module = await import(/* webpackChunkName: "intl-messages" */ `../intl/${locale}.json`);

    return module.default;
};

export default withIntlApp(loadLocale)(App);
```

### 4. Use `getIntlProps` in your pages.

```js
// pages/index.js
import React from 'react';
import { getIntlProps } from '@moxy/next-intl';

const Home = () => (
    <main>
        <FormattedMessage id="hello" />
    </main>
);

export const getStaticProps = async ({ locale }) => ({
    props: await getIntlProps(locale),
});

export default Home;
```

If you already are using `getStaticProps` for something else:

```js
export const getServerSideProps = async ({ locale }) => {
    const [foo, localeProps] = await Promise.all([
        fetchFoo(),
        getIntlProps(locale);
    ]);

    return {
        foo,
        ...localeProps,
    };
};
```

> ℹ️ If you are using `getServerSideProps()`, then it works the same as the examples that use `getStaticProps()`.

> ℹ️ Unfortunately, there's currently no other solution than having to use `getIntlProps()` in all pages. This may change in the future, once Next.js supports `getStaticProps()` and `getServerSideProps()` in a custom App.

## FAQ

### How can I use this `getIntlProps()` in my page's `getInitialProps()`?

```js
// pages/index.js
import React from 'react';
import { getIntlProps } from '@moxy/next-intl';

const Home = () => (
    <main>
        <FormattedMessage id="hello" />
    </main>
);

Home.getInitialProps = async ({ locale }) => ({
    ...await getIntlProps(locale),
});

export default Home;
```

However, the `locale` parameter will be undefined in the `getInitialProps()` function above because Next.js doesn't pass it as of now, but there's an [open pull-request](https://github.com/vercel/next.js/pull/21930) to resolve it.

To circumvent this, you must override `pages/_app.js` like so:

```js
// pages/_app.js
import App from 'next/app';

const MyApp = (props) => <App { ...props } />;

MyApp.getInitialProps = async (appCtx) => {
    appCtx.ctx.locale = appCtx.router.locale;
    appCtx.ctx.locales = appCtx.router.locales;
    appCtx.ctx.defaultLocale = appCtx.router.defaultLocale;

    const appProps = await App.getInitialProps(appCtx);

    return appProps;
};

export default MyApp;
```

> ⚠️ Adding `getInitialProps()` to your App will disable Automatic Static Optimization in pages without Static Generation.

### I don't want to repeat `getIntlProps()` in all my page's.

In you can `getIntlProps()` once in your `pages/_app.js`, like so:

```js
// pages/_app.js
import App from 'next/app';

const MyApp = (props) => <App { ...props } />;

MyApp.getInitialProps = async (appCtx) => {
    const [intlProps, appProps] = await Promise.all([
        getIntlProps(appCtx.router.locale),
        App.getInitialProps(appCtx),
    ]);

    return {
        ...intlProps,
        ...appProps,
    };
};

export default MyApp;
```

> ⚠️ Adding `getInitialProps()` to your App will disable Automatic Static Optimization in pages without Static Generation.

### How do I load polyfills?

In previous versions of this library, all polyfills were automatically downloaded. This is no longer the case. However, you may load any polyfills and locale data inside the `loadLocale()` function.

Here's an example that loads the [`@formatjs/intl-pluralrules`](https://formatjs.io/docs/polyfills/intl-pluralrules/) polyfill.

```js
// _app.js
import { shouldPolyfill as shouldPolyfillPluralRules } from '@formatjs/intl-pluralrules/should-polyfill';

// ...

const loadLocale = async (locale) => {
    if (shouldPolyfillPluralRules()) {
        await import(/* webpackChunkName: "intl-pluralrules" */ '@formatjs/intl-pluralrules/polyfill');
    }

    if (Intl.PluralRules.polyfilled) {
        switch (locale) {
        case 'pt':
            await import(/* webpackChunkName: "intl-pluralrules-pt" */ '@formatjs/intl-pluralrules/locale-data/pt')
            break;
        default:
            await import(/* webpackChunkName: "intl-pluralrules-en" */ '@formatjs/intl-pluralrules/locale-data/en')
            break
        }
    }

    const module = await import(/* webpackChunkName: "intl-messages" */ `../intl/${locale}.json`);

    return module.default;
};

export default withIntlApp(loadLocale)(App);
```

## Tests

```sh
$ npm t
$ npm t -- --watch  # To run watch mode
```

## License

Released under the [MIT License](https://opensource.org/licenses/mit-license.php).
