# next-intl

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

[npm-url]:https://npmjs.org/package/@moxy/next-intl
[downloads-image]:https://img.shields.io/npm/dm/@moxy/next-intl.svg
[npm-image]:https://img.shields.io/npm/v/@moxy/next-intl.svg
[travis-url]:https://travis-ci.org/moxystudio/next-intl
[travis-image]:https://img.shields.io/travis/moxystudio/next-intl/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/next-intl
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/next-intl/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/next-intl
[david-dm-image]:https://img.shields.io/david/moxystudio/next-intl.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/next-intl?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/next-intl.svg

Library to integrate [`react-intl`](https://www.npmjs.com/package/react-intl) with Next.js, making it easy to manage the current locale based on configurable policies.


## Installation

```sh
$ npm install --save @moxy/next-intl react-intl
```

All the polyfilling will be taken care by this library automatically, so that you don't need to worry about `react-intl` [runtime requirements](https://github.com/formatjs/react-intl/blob/master/docs/Getting-Started.md#runtime-requirements).

> ℹ️ If you are running Node.js `< 13.0.x`, you must also install `full-icu` and start node with [`--icu-data-dir=node_modules/full-icu`](https://github.com/zeit/next.js/blob/5e6f79117fae59ec3a6a3260808f611862c53f0a/examples/with-react-intl/package.json#L5).

## Setup

#### 1. Create a root folder named `intl` with the following structure:

```
intl/
  index.js
  messages/
    en-US.json
```

The `index.js` file should have the following contents:

```js
import { cookiePolicy, acceptLanguagePolicy, defaultPolicy } from '@moxy/next-intl';

export default {
    locales: [
        {
            id: 'en-US',
            name: 'English',
            loadMessages: async () => {
                const module = await import(/* webpackChunkName: "intl-messages/en-US" */ './messages/en-US.json');

                return module.default;
            },
        },
    ],
    policies: [
        cookiePolicy(),
        acceptLanguagePolicy(),
        defaultPolicy('en-US'),
    ],
};
```

You may declare more locales by adding them into the `locales` array.

#### 2. Include `<NextIntlScript>` in `pages/_document.js`:

```js
import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { NextIntlScript } from '@moxy/next-intl';

export default class MyDocument extends Document {
    render() {
        const { assetPrefix } = this.props.__NEXT_DATA__;

        return (
            <Html>
                <Head />
                <body>
                    <Main />
                    <NextIntlScript assetPrefix={ assetPrefix } />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
```

#### 3. Wrap your app with `withSetupNextIntl()` in `pages/_app.js`:

```js
import React from 'react';
import App from 'next/app';
import { withSetupNextIntl } from '@moxy/next-intl';
import nextIntlConfig from '../intl';

export default withSetupNextIntl(nextIntlConfig, App);
```

Here's an example if you have a custom app:

```js
import React from 'react';
import App from 'next/app';
import { withSetupNextIntl } from '@moxy/next-intl';
import nextIntlConfig from '../intl';
import Layout from '../components/layout';

class MyApp extends App {
    render() {
        const { Component, pageProps } = this.props;

        return (
            <Layout>
                <Component { ...pageProps } />
            </Layout>
        );
    }
}

export default withSetupNextIntl(nextIntlConfig, MyApp);
```

#### 4. Ready!

You may now use [`react-intl`](https://www.npmjs.com/package/react-intl) as you normally would. Moreover, you will receive the current locale in your pages' `getInitialProps` static function.

```js
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

export default class Homepage extends Component {
    static getInitialProps({ locale }) {
        // You may do something with `locale`, such as
        // fetching localized information from a CMS
    }

    render() {
        return (
            <main>
                <FormattedMessage id="hello" />
            </main>
        );
    }
}
```


## API

### &lt;NextIntlScript&gt;

`<NextIntlScript>` is a React component responsible for conditionally loading [Intl polyfills and locale data](https://github.com/formatjs/react-intl/blob/master/docs/Getting-Started.md#runtime-requirements) if necessary.

Please check the [setup](#setup) guide to know how to set it up.

### useNextIntlSetup(config, App)

A higher-order React component that wraps `App`, setting up `getInitialProps` and [`<NextIntlProvider>`](#nextintlprovider) automatically.

Please check the [setup](#setup) guide to know how to set it up.

#### config

Type: `object`

> ℹ️ You may also pass any of the supported `react-intl`'s [`<IntlProvider>`](https://github.com/formatjs/react-intl/blob/master/docs/Components.md#intlprovider) props, except for `locale` and `messages`.

##### locales

Type: `Array`

The list of supported locales. Each locale is an object with the following shape:

```js
{
    id: 'en-US',
    name: 'English',
    loadMessages: async () => {
        // Usually you would use an `import()` statement here,
        // but you may load messages from some API such as a CMS.
    },
}
```

##### policies

Type: `Array`

The list of [policies](#policies-1) ordered by preference.

#### App

Type: `Component`

The App component that will be wrapped.

### &lt;NextIntlProvider&gt;

A React component sets up [`react-intl`](https://www.npmjs.com/package/react-intl)'s `<IntlProvider>` and automatically manages the current locale based on the configured locales and policies.

> ⚠️ Please note that you should use [`withNextIntlSetup`](#usenextintlsetup) rather than setting up the provider yourself.

The provider value is an object with the following shape:

```js
const nextIntl = {
    // The current locale object
    locale,
    // The array of supported locales
    locales,
    // A function to change the locale
    // Receives the locale id and returns a promise
    changeLocale,
    // The react-intl's intl object
    intl,
};
```

### &lt;NextIntlConsumer&gt;

A React component that gives you access to the [`<NextIntlProvider>`](#nextintlprovider) value.

This may be useful to render a language selection dropdown:

```js
import { NextIntlConsumer } from '@moxy/next-intl';

const LanguageSelect = () => (
    <NextIntlConsumer>
        { ({ locales, locale, changeLocale }) => (
            <select
                value={ locale.id }
                onChange={ (event) => changeLocale(event.target.value) }>
                { locales.map(({ id, name }) => (
                    <option key={ id } value={ id }>{ name }</option>
                )) }
            </select>
        ) }
    </NextIntlConsumer>
);

export default LanguageSelect;
```

The `changeLocale(localeId)` function returns a promise, giving you the ability to render a loading while the switch is happening and display an error message if the switch failed.

### useNextIntl()

The hook version of [`<NextIntlConsumer>`](#nextintlconsumer).

Again, this may be useful to render a language selection dropdown:

```js
import { useCallback } from 'react';
import { useNextIntl } from '@moxy/next-intl';

const LanguageSelect = () => {
    const { locales, locale, changeLocale } = useNextIntl();

    const handleHange = useCallback(
        (event) => changeLocale(event.target.value),
        [changeLocale],
    );

    return (
        <select value={ locale.id } onChange={ handleHange }>
            { locales.map(({ id, name }) => (
                <option key={ id } value={ id }>{ name }</option>
            )) }
        </select>
    );
};

export default LanguageSelect;
```

### withNextIntl(Component)

The higher order component version of [`<NextIntlConsumer>`](#nextintlconsumer), injecting the [`<NextIntlProvider>`](#nextintlconsumer) value as the `nextIntl` prop.

```js
import { useCallback } from 'react';
import { useNextIntl } from '@moxy/next-intl';

const LanguageSelect = ({ nextIntl }) => {
    const { locales, locale, changeLocale } = nextIntl;

    // ...
};

export default LanguageSelect;
```

### Policies

#### cookiePolicy(options?)

A policy that saves the locale preference in a cookie and then matches against the `Cookie` request header or `document.cookie`.

##### options

Type: `object`

Any [options](https://github.com/reactivestack/cookies/tree/master/packages/universal-cookie#setname-value-options) from the `universal-cookie` set method are available as well.

###### name

Type: `string`<br>
Default: `locale`

#### acceptLanguagePolicy()

A policy that uses the browser's language by matching against the `Accept-Language` request header or `navigator.languages`.

#### defaultPolicy(localeId)

A policy the simply returns `localeId` to serve as the fallback locale.

##### localeId

Type: `string`

The locale id to use as the default locale.

#### Custom policies

You may want to create custom policies for certain use-cases. One common use-case is to have a policy that matches against the locale saved in the account preferences of authenticated users.

A policy is a simple object that must have a `match` method and optionally a `watch`, `act` and `save` methods. Please check out the built-in [policies](src/policies) to know how to implement one.


## Tests

```sh
$ npm t
$ npm t -- --watch  # To run watch mode
```


## License

Released under the [MIT License](https://opensource.org/licenses/mit-license.php).
