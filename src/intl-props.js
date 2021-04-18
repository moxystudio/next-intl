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

export const getCachedProps = () => ({
    intl: {
        messages: cache.messages ?? {},
    },
});

const getIntlProps = async (locale) => {
    let messages;

    if (process.env.NODE_ENV !== 'production' && !localeLoader) {
        throw new Error('No loadLocale() function configured. Did you forget to wrap your app using withIntlApp()?');
    }

    if (typeof window === 'undefined') {
        messages = await localeLoader(locale);
    } else if (cache.locale !== locale || !cache.messages) {
        messages = await localeLoader(locale);

        if (process.env.NODE_ENV !== 'production' && !messages) {
            throw new Error('Expecting loadLocale() to return a messages object');
        }

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
