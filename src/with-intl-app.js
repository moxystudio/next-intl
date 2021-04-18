import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { IntlProvider } from 'react-intl';
import { useRouter } from 'next/router'; // eslint-disable-line no-restricted-imports
import { setLocaleLoader, getCachedProps } from './intl-props';

const withIntlApp = (loadLocale) => {
    setLocaleLoader(loadLocale);

    return (WrappedApp) => {
        const WithIntlApp = (props) => {
            const router = useRouter();
            const { locale, defaultLocale } = router;
            const { pageProps: { intl, ...restPageProps }, ...restProps } = props;

            // When Next.js is rendering the _error page, it doesn't call getStaticProps and friends sometimes..
            // In those situations, we fallback to the cached props.
            const finalIntl = ('statusCode' in restPageProps) && !intl ? getCachedProps() : intl;

            if (process.env.NODE_ENV !== 'production' && !finalIntl) {
                // eslint-disable-next-line max-len
                throw new Error('Could not find "intl" prop. Did you forget to use "getIntlProps()" inside "getStaticProps()" or "getServerSideProps()" in your page?');
            }

            return (
                <IntlProvider
                    locale={ locale }
                    defaultLocale={ defaultLocale }
                    messages={ finalIntl.messages }>
                    <WrappedApp pageProps={ restPageProps } { ...restProps } />
                </IntlProvider>
            );
        };

        WithIntlApp.propTypes = {
            pageProps: PropTypes.object.isRequired,
        };

        WithIntlApp.displayName = `withIntlApp(${WrappedApp.displayName || WrappedApp.name || /* istanbul ignore next */ 'App'})`;

        hoistNonReactStatics(WithIntlApp, WrappedApp);

        return WithIntlApp;
    };
};

export default withIntlApp;
