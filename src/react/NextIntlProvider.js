import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { RawIntlProvider, createIntl, createIntlCache } from 'react-intl';
import NextIntlContext from './util/context';
import createManager, { getInitialData } from '../manager';

const Provider = NextIntlContext.Provider;

export default class NextIntlProvider extends PureComponent {
    static propTypes = {
        locales: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            id: PropTypes.string.isRequired,
            loadMessages: PropTypes.func.isRequired,
        })),
        policies: PropTypes.arrayOf(PropTypes.shape({
            match: PropTypes.func.isRequired,
            watch: PropTypes.func,
            save: PropTypes.func,
            act: PropTypes.func,
        })),
        initialData: PropTypes.shape({
            localeId: PropTypes.string.isRequired,
            messages: PropTypes.object.isRequired,
        }),
        onChange: PropTypes.func,
        children: PropTypes.node,
    };

    state;
    manager;
    intlCache = createIntlCache();

    constructor(props) {
        super(props);

        this.buildManager();
        this.state = this.buildState();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.locales !== this.props.locales ||
            prevProps.policies !== this.props.policies) {
            this.buildManager();
            this.setState(this.buildState());
        }

        if (prevState !== this.state) {
            this.props.onChange?.(this.state);
        }
    }

    componentWillUnmount() {
        this.manager.destroy();
    }

    render() {
        const { children } = this.props;
        const value = this.state;

        return (
            <Provider value={ value }>
                <RawIntlProvider value={ value.intl }>
                    { children }
                </RawIntlProvider>
            </Provider>
        );
    }

    getValue() {
        return this.state;
    }

    buildManager() {
        const { locales, policies, initialData } = this.props;
        const data = this.manager ? this.manager.toData() : initialData;

        this.manager?.destroy();

        this.manager = createManager(locales, policies, data);
        this.manager.onLocaleChange(() => this.setState(this.buildState()));
    }

    buildState() {
        const { locales, policies, initialData, onChange, children, ...intlConfig } = this.props;

        const { locale, messages, changeLocale } = this.manager;
        const intl = createIntl({
            ...intlConfig,
            locale: locale.id,
            messages,
        });

        return {
            locales,
            locale,
            changeLocale,
            intl,
        };
    }
}

export const getInitialProps = async (config, ctx) => {
    const { locales, policies } = config;

    const initialData = await getInitialData(locales, policies, ctx);

    return { initialData };
};
