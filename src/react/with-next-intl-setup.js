import React, { Component } from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatics from 'hoist-non-react-statics';
import App from 'next/app';
import NextIntlProvider, { getInitialProps, toInitialProps } from './NextIntlProvider';

const withNextIntlSetup = (config) => (WrappedApp) => {
    let _locale;
    let _nextIntlProviderProps;
    let _provider;

    class WithNextIntlSetup extends Component {
        static propTypes = {
            appProps: PropTypes.object,
            nextIntlProviderProps: PropTypes.object,
        };

        static displayName = `withNextIntlSetup(${WrappedApp.displayName || WrappedApp.name || /* istanbul ignore next */ 'App'})`;

        static async getInitialProps(appCtx) {
            const nextIntlProviderProps = _nextIntlProviderProps ?? await getInitialProps(config, appCtx.ctx);
            const locale = _locale ?? config.locales.find(({ id }) => id === nextIntlProviderProps.initialData.localeId);

            appCtx.ctx.locale = locale;

            if (typeof window !== 'undefined') {
                _nextIntlProviderProps = nextIntlProviderProps;
                _locale = locale;
            }

            const appProps = await (WrappedApp.getInitialProps ? WrappedApp.getInitialProps(appCtx) : App.getInitialProps(appCtx));

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
            _provider = provider;

            if (provider) {
                _nextIntlProviderProps = toInitialProps(provider);
                _locale = provider.getValue().locale;
            } else {
                _nextIntlProviderProps = _locale = undefined;
            }
        };

        handleChange = () => {
            _nextIntlProviderProps = toInitialProps(_provider);
            _locale = _provider.getValue().locale;
        };
    }

    hoistNonReactStatics(WithNextIntlSetup, WrappedApp, { getInitialProps: true });

    return WithNextIntlSetup;
};

export default withNextIntlSetup;
