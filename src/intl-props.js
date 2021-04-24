import { useRouter } from 'next/router'; // eslint-disable-line no-restricted-imports

// We cache the messages on the client-side to avoid loading messages on every page change.
let cache = {};
let localeLoader;

export const clearCache = () => {
    cache = {};
};

export const setLocaleLoader = (loadLocale) => {
    localeLoader = loadLocale;
};

export const useIntlProps = (props) => {
    const router = useRouter();
    const { locale, defaultLocale } = router;
    const { pageProps: { intl: intl1, ...restPageProps } = {}, intl: intl2, ...restProps } = props;

    const intl = intl1 ?? intl2;

    // When Next.js is rendering the _error page, it doesn't call getStaticProps and friends sometimes..
    // In those situations, we fallback to cached messages.
    const messages = props.err && !intl ? cache.messages : intl?.messages;

    // If no `intl` prop was found, hint the user that he forgot to use `getIntlProps()`.
    if (process.env.NODE_ENV !== 'production' && !messages && !props.err) {
        // eslint-disable-next-line max-len
        throw new Error('Could not find "intl" prop. Did you forget to use "getIntlProps()" inside "getStaticProps()", "getServerSideProps()" or "getInitialProps()" in your page or app?');
    }

    // Store in cache, only on client-side.
    if (typeof window !== 'undefined') {
        cache.locale = locale;
        cache.messages = messages;
    }

    return {
        locale,
        defaultLocale,
        messages,
        modifiedProps: {
            ...restProps,
            pageProps: restPageProps,
        },
    };
};

export const getIntlProps = async (locale) => {
    if (process.env.NODE_ENV !== 'production' && !localeLoader) {
        throw new Error('No loadLocale() function configured. Did you forget to wrap your app using withIntlApp()?');
    }

    let messages;

    // We avoid having to refetch if we got cached messages belonging to the same locale.
    // Please note that cache on server-side is always empty, so that messages are always fresh.
    if (cache.locale === locale && cache.messages) {
        messages = cache.messages;
    } else {
        messages = await localeLoader(locale);

        // Hint the user if he forgot to return messages.
        if (process.env.NODE_ENV !== 'production' && !messages) {
            throw new Error('Expecting loadLocale() to return a messages object');
        }
    }

    return {
        intl: {
            messages,
        },
    };
};
