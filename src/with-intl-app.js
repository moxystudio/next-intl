import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { IntlProvider } from 'react-intl';
import { setLocaleLoader, useIntlProps } from './intl-props';

const withIntlApp = (loadLocale) => {
    setLocaleLoader(loadLocale);

    return (WrappedApp) => {
        const WithIntlApp = (props) => {
            const { locale, defaultLocale, messages, modifiedProps } = useIntlProps(props);

            return (
                <IntlProvider
                    locale={ locale }
                    defaultLocale={ defaultLocale }
                    messages={ messages }>
                    <WrappedApp { ...modifiedProps } />
                </IntlProvider>
            );
        };

        WithIntlApp.displayName = `withIntlApp(${WrappedApp.displayName || WrappedApp.name || /* istanbul ignore next */ 'App'})`;

        hoistNonReactStatics(WithIntlApp, WrappedApp);

        return WithIntlApp;
    };
};

export default withIntlApp;
