/* global __NEXT_DATA__:true */

// We cache the messages on the client-side to avoid loading messages on every page change.
const cache = typeof window === 'undefined' ?
    {} :
    {
        locale: __NEXT_DATA__.locale,
        messages: __NEXT_DATA__.props.pageProps.intl?.messages,
    };

let localeLoader;

export const setLocaleLoader = (loadLocale) => {
    localeLoader = loadLocale;
};

const getIntlProps = async (locale) => {
    let messages;

    if (process.env.NODE_ENV !== 'production' && !localeLoader) {
        throw new Error('No loadLocale() function configured. Did you forget to wrap your app using withIntlApp()?');
    }

    if (typeof window === 'undefined') {
        messages = await localeLoader(locale);
    } else if (cache.locale !== locale || !cache.messages) {
        messages = await localeLoader(locale);

        cache.locale = locale;
        cache.messages = messages;
    } else {
        messages = cache.messages;
    }

    return {
        intl: {
            messages,
        },
    };
};

export default getIntlProps;
