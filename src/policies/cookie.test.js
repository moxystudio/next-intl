import cookiePolicy from './cookie';

const locales = [
    { id: 'en-US', name: 'English' },
    { id: 'pt-PT', name: 'Português' },
];

beforeAll(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3);

    global.BroadcastChannel = jest.fn(() => {
        const listeners = new Set();

        return {
            postMessage: jest.fn((data) => listeners.forEach((fn) => fn({ data }))),
            addEventListener: jest.fn((name, fn) => listeners.add(fn)),
            close: jest.fn(),
        };
    });
});

afterEach(() => {
    global.BroadcastChannel.mockClear();
});

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

    it('should match cookie against available locales', () => {
        const policy = cookiePolicy();

        const req = {
            headers: { cookie: 'locale=pt-PT;foo=bar' },
        };
        const res = {
            getHeader: () => null,
            setHeader: () => {},
        };

        const locale = policy.match(locales, { req, res });

        expect(locale).toBe('pt-PT');
    });

    it('should return null if cookie did not match against any of the available locales', () => {
        const policy = cookiePolicy();

        const req = {
            headers: { cookie: 'locale=it-IT' },
        };
        const res = {
            getHeader: () => null,
            setHeader: () => {},
        };

        const locale = policy.match(locales, { req, res });

        expect(locale).toBe(null);
    });

    it('should set Vary header if it matched', () => {
        const policy = cookiePolicy();

        const req = {
            headers: { cookie: 'locale=pt-PT;foo=bar' },
        };
        const res = {
            getHeader: () => null,
            setHeader: jest.fn(() => {}),
        };

        policy.match(locales, { req, res });

        expect(res.setHeader).toHaveBeenCalledTimes(1);
        expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Cookie');
    });

    it('should not set Vary header if it did not matched', () => {
        const policy = cookiePolicy();

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
    let documentCookieGetter;
    const userAgent = navigator.userAgent;

    beforeAll(() => {
        documentCookieGetter = jest.spyOn(document, 'cookie', 'get');
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko)',
            writable: true,
        });
    });

    afterAll(() => {
        documentCookieGetter.mockRestore();
        navigator.userAgent = userAgent;
    });

    it('should match cookie against available locales', () => {
        documentCookieGetter.mockReturnValue('locale=pt-PT;foo=bar');

        const policy = cookiePolicy();
        const locale = policy.match(locales, {});

        expect(locale).toBe('pt-PT');
    });

    it('should return null if cookie did not match against any of the available locales', () => {
        documentCookieGetter.mockReturnValue('locale=it-IT');

        const policy = cookiePolicy();
        const locale = policy.match(locales, {});

        expect(locale).toBe(null);
    });
});

describe('watch()', () => {
    it('should listen to locale change messages using BroadcastChannel', () => {
        const policy = cookiePolicy();
        const callback = jest.fn();

        policy.watch(callback);

        expect(BroadcastChannel).toHaveBeenCalledTimes(1);
        expect(BroadcastChannel).toHaveBeenCalledWith('__NEXT_INTL__');

        const broadcastChannel = BroadcastChannel.mock.results[0].value;

        broadcastChannel.postMessage({
            uid: 'foo',
            localeId: 'it-IT',
        });

        expect(broadcastChannel.addEventListener.mock.calls[0][0]).toBe('message');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('it-IT');
    });

    it('should ignore broadcasted messages from itself', () => {
        const policy = cookiePolicy();
        const callback = jest.fn();

        policy.watch(callback);

        expect(BroadcastChannel).toHaveBeenCalledTimes(1);

        const broadcastChannel = BroadcastChannel.mock.results[0].value;

        broadcastChannel.postMessage({
            uid: Math.round(Math.random() * (10 ** 17)).toString(36),
            localeId: 'it-IT',
        });

        expect(broadcastChannel.addEventListener.mock.calls[0][0]).toBe('message');
        expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should return a unwatch function that stops listenting to language change events', () => {
        const policy = cookiePolicy();
        const callback = jest.fn();

        const unwatch = policy.watch(callback);

        expect(BroadcastChannel).toHaveBeenCalledTimes(1);

        const broadcastChannel = BroadcastChannel.mock.results[0].value;

        unwatch();

        expect(broadcastChannel.close).toHaveBeenCalledTimes(1);
    });
});

describe('save()', () => {
    let documentCookieGetter;
    let documentCookieSetter;
    const userAgent = navigator.userAgent;

    beforeAll(() => {
        documentCookieGetter = jest.spyOn(document, 'cookie', 'get');
        documentCookieSetter = jest.spyOn(document, 'cookie', 'set');

        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko)',
            writable: true,
        });
    });

    afterAll(() => {
        documentCookieGetter.mockRestore();
        documentCookieSetter.mockRestore();

        navigator.userAgent = userAgent;
    });

    it('should save cookie correctly', () => {
        const policy = cookiePolicy();

        policy.save(locales[0]);

        expect(documentCookieSetter).toHaveBeenCalledTimes(1);
        expect(documentCookieSetter).toHaveBeenCalledWith(`locale=${locales[0].id}`);
    });

    it('should broadcast change using BroadcastChannel', () => {
        const policy = cookiePolicy();

        policy.save(locales[0]);

        expect(BroadcastChannel).toHaveBeenCalledTimes(1);
        expect(BroadcastChannel).toHaveBeenCalledWith('__NEXT_INTL__');

        const broadcastChannel = BroadcastChannel.mock.results[0].value;

        expect(broadcastChannel.postMessage).toHaveBeenCalledTimes(1);
        expect(broadcastChannel.postMessage).toHaveBeenCalledWith({
            uid: Math.round(Math.random() * (10 ** 17)).toString(36),
            localeId: locales[0].id,
        });
    });
});

describe('act()', () => {
    it('should not be present', () => {
        const policy = cookiePolicy();

        expect(policy).not.toHaveProperty('act');
    });
});
