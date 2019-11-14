import React, { createContext, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';
import createManager from '../manager';

const NextIntlContext = createContext();
const Provider = NextIntlContext.Provider;

class NextIntlProvider extends PureComponent {
    state = {};
    manager;

    constructor(props) {
        super(props);

        this.buildManager();
        this.state = this.buildState();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.locales !== this.props.locales ||
            prevProps.policies !== this.props.policies) {
            this.buildManager();
            this.setState(this.buildState());
        }
    }

    render() {
        const { locales, children, ...rest } = this.props;
        const { providerValue, intlProps } = this.state;

        return (
            <Provider value={ providerValue }>
                <IntlProvider { ...rest } { ... intlProps }>
                    { children }
                </IntlProvider>
            </Provider>
        );
    }

    buildManager() {
        const { locales, policies, initialData } = this.props;
        const data = this.manager ? this.manager.toData() : initialData;

        this.manager.destroy();

        this.manager = createManager(locales, policies, data);
        this.manager.onLocaleChange(() => this.setState(this.buildState()));
    }

    buildState() {
        const { locales } = this.props;

        return {
            providerValue: {
                locales,
                locale: this.manager.locale,
                changeLocale: this.manager.changeLocale,
            },
            intlProps: {
                locale: this.manager.locale.id,
                messages: this.manager.messages,
            },
        };
    }
}

NextIntlProvider.propTypes = {
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
    }).isRequired,
    children: PropTypes.node,
};

NextIntlContext.Provider = NextIntlProvider;
NextIntlContext.Consumer.Provider = NextIntlProvider;

export default NextIntlContext;
