# next-intl

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

[npm-url]:https://npmjs.org/package/@moxy/next-intl
[downloads-image]:https://img.shields.io/npm/dm/@moxy/next-intl.svg
[npm-image]:https://img.shields.io/npm/v/@moxy/next-intl.svg
[travis-url]:https://travis-ci.org/moxystudio/next-intl
[travis-image]:http://img.shields.io/travis/moxystudio/next-intl/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/next-intl
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/next-intl/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/next-intl
[david-dm-image]:https://img.shields.io/david/moxystudio/next-intl.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/next-intl?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/next-intl.svg

Library to integrate [react-intl](https://www.npmjs.com/package/react-intl) with Next.js, making it easy to manage the current locale based on configurable policies.


## Installation

```sh
$ npm install --save @moxy/next-intl react-intl
```

If you are running Node.js `< 13.1.0`, you must also install `full-icu` and start node with [`--icu-data-dir=node_modules/full-icu`](https://github.com/zeit/next.js/blob/5e6f79117fae59ec3a6a3260808f611862c53f0a/examples/with-react-intl/package.json#L5).


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

export const locales = [
    {
        id: 'en-US',
        name: 'English',
        loadMessages: async () => {
            const module = await import(/* webpackChunkName: "intl-messages/en-US" */ './messages/en-US.json');

            return module.default;
        },
    }
];

export const policies = [
    cookiePolicy(),
    acceptLanguagePolicy(),
    defaultPolicy('en-US'),
];
```

You may add the locales you support by adding them into the `locales` array.

#### 2. Include `<NextIntlScript>` in `pages/_doc.js`:

```js
import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { NextIntlScript } from 'next-intl';

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head />
                <body>
                    <Main />
                    <NextIntlScript />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
```

#### 3. Include `getInitialIntlData()` and `<NextIntlProvider>` in `pages/_app.js`:

```js
import React from 'react';
import App from 'next/app';
import { NextIntlProvider, getInitialIntlData } from 'next-intl';

export default class MyApp extends App {
    static async getInitialProps(appContext) {
        const appProps = await super.getInitialProps(appContext);
        const initialIntData = await getInitialIntlData(locales, policies, appContext.ctx);

        return { ...appProps, initialIntData };
    }


    render() {
        const { Component, pageProps, intlData } = this.props;

        return (
            <NextIntlProvider
                locales={ locales }
                policies={ policies }
                initialData={ initialIntData }>
                <Component { ...pageProps } />
            </NextIntlProvider>
        );
    }
}
```


## API

### &lt;NextIntlScript&gt;

`<NextIntlScript>` is a React component responsible for conditionally loading [Intl polyfills and locale data](https://github.com/formatjs/react-intl/blob/master/docs/Getting-Started.md#runtime-requirements) if necessary.

Note that you must add `<NextIntlScript>` to your Document's render method. Please check the [setup](#setup) guide for more information.

### &lt;NextIntlProvider&gt;

This component is a wrapper to [react-intl](https://www.npmjs.com/package/react-intl)'s `<IntlProvider>` that automatically manages the current locale based on the configured policies.

Available props:

> You may also pass any of the supported `react-intl`'s `<IntlProvider>` props.

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

The list of [policies](#policies-2) ordered by preference.

##### initialData

Type: `object`

The object returned from the [`getInitialIntlData()`](#getinitialintldata) promise.

### &lt;NextIntlConsumer&gt;

Access the `<NextIntlProvider>` value, which is an object providing the list of locales, the current locale and a function to change the current locale.

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
```

The `changeLocale(localeId)` function allows you to explictely change the locale identified by `localeId`. Since it's an asynchronous operation, it returns a promise that fulfills once the switch is done.

### useNextIntl()

The hook version of `<NextIntlConsumer>`.

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
```

### getInitialIntlData(locales, policies, ctx)

Resolves the initial intl data based on the server request, such as the locale id and messages.
Returns an object that you must pass to `<NextIntlProvider>` as the `initialData` prop. On the client-side however, this method will return `undefined`.

Note that you must call `getInitialIntlData()` in your Apps's `getInitialProps()` method. Please check the [setup](#setup) guide for more information.

##### locales

Type: `Array`

The list of supported locales.

##### policies

Type: `Array`

The list of [policies](#policies-2) ordered by preference.


##### ctx

Type: `object`

The `ctx` property of the first argument of `App.getInitialProps`.

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
