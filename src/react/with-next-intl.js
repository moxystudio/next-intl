import React, { forwardRef } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import useNextIntl from './use-next-intl';

const withNextIntl = (WrappedComponent) => {
    const WithNextIntl = forwardRef((props, ref) => {
        const nextIntl = useNextIntl();

        return (
            <WrappedComponent ref={ ref } { ...props } nextIntl={ nextIntl } />
        );
    });

    WithNextIntl.displayName = `withNextIntl(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    hoistNonReactStatics(WithNextIntl, WrappedComponent);

    return WithNextIntl;
};

export default withNextIntl;
