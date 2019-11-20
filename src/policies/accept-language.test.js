import acceptLanguagePolicy from './accept-language';

const locales = [
    { id: 'en-US', name: 'English' },
    { id: 'pt-PT', name: 'Português' },
];

describe('match() - SS', () => {
    const globalWindow = window;

    beforeAll(() => {
        Object.defineProperty(global, 'window', {
            value: undefined,
            writable: true,
        });
    });

    afterAll(() => {
        global.window = globalWindow;
    });

    it('should match Accept-Language header against available locales', () => {
        const policy = acceptLanguagePolicy();

        const req = {
            headers: { 'accept-language': 'pt-PT;q=0.8,en-US;q=0.7,es-ES;q=0.3' },
        };
        const res = {
            getHeader: () => null,
            setHeader: () => {},
        };

        const locale = policy.match(locales, { req, res });

        expect(locale).toBe('pt-PT');
    });

    it('should loosely match Accept-Language header against available locales', () => {
        const policy = acceptLanguagePolicy();

        const req = {
            headers: { 'accept-language': 'pt-BR' },
        };
        const res = {
            getHeader: () => null,
            setHeader: () => {},
        };

        const locale = policy.match(locales, { req, res });

        expect(locale).toBe('pt-PT');
    });

    it('should not loosely match Accept-Language header against available locales when options.loose is false', () => {
        const policy = acceptLanguagePolicy({ loose: false });

        const req = {
            headers: { 'accept-language': 'pt-BR' },
        };
        const res = {
            getHeader: () => null,
            setHeader: () => {},
        };

        const locale = policy.match(locales, { req, res });

        expect(locale).toBe(null);
    });

    it('should return null if Accept-Language header did not match against any of the available locales', () => {
        const policy = acceptLanguagePolicy();

        const req = {
            headers: { 'accept-language': 'it-IT' },
        };
        const res = {
            getHeader: () => null,
            setHeader: () => {},
        };

        const locale = policy.match(locales, { req, res });

        expect(locale).toBe(null);
    });

    it('should set Vary header if it matched', () => {
        const policy = acceptLanguagePolicy();

        const req = {
            headers: { 'accept-language': 'pt-PT;q=0.8,en-US;q=0.7,es-ES;q=0.3' },
        };
        const res = {
            getHeader: () => null,
            setHeader: jest.fn(() => {}),
        };

        policy.match(locales, { req, res });

        expect(res.setHeader).toHaveBeenCalledTimes(1);
        expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Language');
    });

    it('should not set Vary header if it did not matched', () => {
        const policy = acceptLanguagePolicy();

        const req = {
            headers: { 'accept-language': 'it-IT' },
        };
        const res = {
            getHeader: () => null,
            setHeader: jest.fn(() => {}),
        };

        policy.match(locales, { req, res });

        expect(res.setHeader).toHaveBeenCalledTimes(0);
    });
});

describe('match() - CS', () => {
    let navigatorLanguages;

    beforeAll(() => {
        navigatorLanguages = jest.spyOn(window.navigator, 'languages', 'get');
    });

    afterAll(() => {
        navigatorLanguages.mockRestore();
    });

    it('should match navigator languages against available locales', () => {
        navigatorLanguages.mockReturnValue(['pt-PT', 'en-US', 'es-ES']);

        const policy = acceptLanguagePolicy();
        const locale = policy.match(locales, {});

        expect(locale).toBe('pt-PT');
    });

    it('should loosely match navigator languages against available locales', () => {
        navigatorLanguages.mockReturnValue(['pt-BR']);

        const policy = acceptLanguagePolicy();
        const locale = policy.match(locales, {});

        expect(locale).toBe('pt-PT');
    });

    it('should not loosely match Accept-Language header against available locales when options.loose is false', () => {
        navigatorLanguages.mockReturnValue(['pt-BR']);

        const policy = acceptLanguagePolicy({ loose: false });
        const locale = policy.match(locales, {});

        expect(locale).toBe(null);
    });

    it('should return null if Accept-Language header did not match against any of the available locales', () => {
        navigatorLanguages.mockReturnValue(['it-IT']);

        const policy = acceptLanguagePolicy();
        const locale = policy.match(locales, {});

        expect(locale).toBe(null);
    });
});

describe('watch()', () => {
    let navigatorLanguage;

    beforeAll(() => {
        navigatorLanguage = jest.spyOn(window.navigator, 'language', 'get');
    });

    afterAll(() => {
        navigatorLanguage.mockRestore();
    });

    it('should listen to languagechange events', () => {
        navigatorLanguage.mockReturnValue('pt-PT');

        const policy = acceptLanguagePolicy();
        const callback = jest.fn();

        policy.watch(callback);

        window.dispatchEvent(new Event('languagechange'));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('pt-PT');
    });

    it('should return a unwatch function that stops listenting to language change events', () => {
        const policy = acceptLanguagePolicy();
        const callback = jest.fn();

        const unwatch = policy.watch(callback);

        window.dispatchEvent(new Event('languagechange'));

        expect(callback).toHaveBeenCalledTimes(1);

        unwatch();

        window.dispatchEvent(new Event('languagechange'));

        expect(callback).toHaveBeenCalledTimes(1);
    });
});

describe('save()', () => {
    it('should not be present', () => {
        const policy = acceptLanguagePolicy();

        expect(policy).not.toHaveProperty('save');
    });
});

describe('act()', () => {
    it('should not be present', () => {
        const policy = acceptLanguagePolicy();

        expect(policy).not.toHaveProperty('act');
    });
});
