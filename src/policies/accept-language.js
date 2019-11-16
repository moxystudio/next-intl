import parser from 'accept-language-parser';
import addVary from './util/vary';

const createPolicy = (options) => {
    options = {
        loose: true,
        ...options,
    };

    return {
        match(locales, { req, res }) {
            const acceptLanguage = typeof window !== 'undefined' ? navigator.languages.join(',') : req?.headers['accept-language'];
            const languages = locales.map((locale) => locale.id);

            const localeId = parser.pick(languages, acceptLanguage, options);

            if (!localeId) {
                return null;
            }

            if (typeof window === 'undefined' && res) {
                addVary(res, 'Accept-Language');
            }

            return localeId;
        },

        watch(callback) {
            const handleLanguageChange = () => callback(navigator.language);

            window.addEventListener('languagechange', handleLanguageChange);

            return () => {
                window.removeEventListener('languagechange', handleLanguageChange);
            };
        },
    };
};

export default createPolicy;
