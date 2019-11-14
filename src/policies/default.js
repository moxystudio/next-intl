const createPolicy = (defaultLocaleId) => ({
    match(locales) {
        const locale = locales.find(({ id }) => id === defaultLocaleId);

        if (!locale) {
            return null;
        }

        return defaultLocaleId;
    },
});

export default createPolicy;
