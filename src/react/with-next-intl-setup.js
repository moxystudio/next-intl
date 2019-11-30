import React, { Component } from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import NextIntlProvider, { getInitialProps } from './NextIntlProvider';

const withNextIntlSetup = (config) => (WrappedApp) => {
    let locale;

    class WithNextIntlSetup extends Component {
        static propTypes = {
            appProps: PropTypes.object,
            nextIntlProviderProps: PropTypes.object,
        };

        static displayName = `withNextIntlSetup(${WrappedApp.displayName || WrappedApp.name || /* istanbul ignore next */ 'App'})`;

        static async getInitialProps(appCtx) {
            let nextIntlProviderProps;

            if (typeof window === 'undefined') {
                nextIntlProviderProps = await getInitialProps(config, appCtx.ctx);
                locale = config.locales.find(({ id }) => id === nextIntlProviderProps.initialData.localeId);
            }

            appCtx.ctx.locale = locale;

            const appProps = await WrappedApp.getInitialProps?.(appCtx);

            return { appProps, nextIntlProviderProps };
        }

        render() {
            const { appProps, nextIntlProviderProps, ...rest } = this.props;

            return (
                <NextIntlProvider
                    ref={ this.providerRef }
                    { ...config }
                    { ...nextIntlProviderProps }
                    onChange={ this.handleChange }>
                    <WrappedApp { ...appProps } { ...rest } />
                </NextIntlProvider>
            );
        }

        providerRef = (provider) => {
            locale = provider?.getValue().locale;
        };

        handleChange = (nextIntl) => {
            locale = nextIntl.locale;
        };
    }

    hoistNonReactStatics(WithNextIntlSetup, WrappedApp, { getInitialProps: true });

    return WithNextIntlSetup;
};

export default withNextIntlSetup;
