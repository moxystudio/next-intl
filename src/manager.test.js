import pDelay from 'delay';
import createManager, { getInitialData } from './manager';

const messages = {
    'en-US': { apple: 'apple' },
    'pt-PT': { apple: 'maça' },
    'ru-RU': { apple: 'яблоко' },
};

const locales = [
    { id: 'en-US', name: 'English', loadMessages: jest.fn(() => messages['en-US']) },
    { id: 'pt-PT', name: 'Português', loadMessages: jest.fn(() => messages['pt-PT']) },
    { id: 'ru-RU', name: 'русский', loadMessages: jest.fn(() => messages['ru-RU']) },
];

afterEach(() => {
    locales.forEach((locale) => locale.loadMessages.mockClear());
});

describe('getInitialData() - SS', () => {
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

    it('should return the correct initial data', async () => {
        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[1].id) },
            { match: jest.fn(() => locales[0].id) },
        ];

        const initialData = await getInitialData(locales, policies);

        expect(policies[0].match).toHaveBeenCalledTimes(1);
        expect(policies[1].match).toHaveBeenCalledTimes(1);
        expect(policies[2].match).toHaveBeenCalledTimes(0);

        expect(locales[0].loadMessages).toHaveBeenCalledTimes(0);
        expect(locales[1].loadMessages).toHaveBeenCalledTimes(1);
        expect(locales[2].loadMessages).toHaveBeenCalledTimes(0);

        expect(initialData).toEqual({
            localeId: locales[1].id,
            messages: messages[locales[1].id],
        });
    });
});

describe('getInitialData() - CS', () => {
    it('should return undefined', async () => {
        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[1].id) },
            { match: jest.fn(() => locales[0].id) },
        ];

        const initialData = await getInitialData(locales, policies);

        expect(policies[0].match).toHaveBeenCalledTimes(0);
        expect(policies[1].match).toHaveBeenCalledTimes(0);
        expect(policies[2].match).toHaveBeenCalledTimes(0);

        expect(locales[0].loadMessages).toHaveBeenCalledTimes(0);
        expect(locales[1].loadMessages).toHaveBeenCalledTimes(0);
        expect(locales[2].loadMessages).toHaveBeenCalledTimes(0);

        expect(initialData).toBe(undefined);
    });
});

describe('init', () => {
    it('should iterate all policies, until one matches a locale', () => {
        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[1].id) },
            { match: jest.fn(() => null) },
        ];

        createManager(locales, policies);

        expect(policies[0].match).toHaveBeenCalledTimes(1);
        expect(policies[1].match).toHaveBeenCalledTimes(1);
        expect(policies[2].match).toHaveBeenCalledTimes(0);
    });

    it('should throw if none of the policies matched a locale', () => {
        const policies = [
            { match: jest.fn(() => null) },
        ];

        expect(() => createManager(locales, policies))
        .toThrow('None of the policies matched a locale.. did you forgot to include the default policy?');
    });

    it('should return the locale of the policy that mached', () => {
        const policies = [
            { match: () => null },
            { match: () => locales[1].id },
        ];

        const manager = createManager(locales, policies);

        expect(manager.locale).toBe(locales[1]);
    });

    it('should fail if a policy matched an unknown locale ', () => {
        const policies = [
            { match: () => 'it-IT' },
        ];

        expect(() => createManager(locales, policies)).toThrow('Unknown locale id: it-IT');
    });

    it('should assume options.initialLocaleId', () => {
        const policies = [
            { match: jest.fn(() => locales[1].id) },
        ];

        const options = { initialLocaleId: locales[0].id };
        const manager = createManager(locales, policies, options);

        expect(manager.locale).toBe(locales[0]);
        expect(policies[0].match).toHaveBeenCalledTimes(0);
    });

    it('should fail if options.initialLocaleId is an unknown locale ', () => {
        const policies = [
            { match: jest.fn(() => locales[0].id) },
        ];

        const options = { initialLocaleId: 'it-IT' };

        expect(() => createManager(locales, policies, options)).toThrow('Unknown locale id: it-IT');
    });

    it('should watch all policies', () => {
        const policies = locales.map(({ id }) => ({
            match: () => id,
            watch: jest.fn(() => {}),
        }));

        createManager(locales, policies);

        policies.forEach((policy) => expect(policy.watch).toHaveBeenCalledTimes(1));
    });

    it('should apply the locale on the first policy that has the act() method', () => {
        const policies = [
            { match: jest.fn(() => null), watch: jest.fn(() => {}) },
            { match: jest.fn(() => locales[1].id), act: jest.fn(() => {}) },
            { match: jest.fn(() => null), act: jest.fn(() => {}) },
        ];

        createManager(locales, policies);

        expect(policies[1].act).toHaveBeenCalledTimes(1);
        expect(policies[1].act).toHaveBeenCalledWith(locales[1]);
        expect(policies[2].act).toHaveBeenCalledTimes(0);
    });
});

describe('policy invoked watch callback', () => {
    it('should iterate all policies, until one matches a locale', () => {
        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[0].id) },
            { match: jest.fn(() => null), watch: jest.fn(() => {}) },
        ];

        createManager(locales, policies);

        const callback = policies[2].watch.mock.calls[0][0];

        policies.forEach(({ match }) => match.mockClear());
        policies.match = jest.fn(() => locales[1].id);
        callback(locales[1].id);

        expect(policies[0].match).toHaveBeenCalledTimes(1);
        expect(policies[1].match).toHaveBeenCalledTimes(1);
        expect(policies[2].match).toHaveBeenCalledTimes(0);
    });

    it('should apply the locale on the first policy that has the act() method', () => {
        const policies = [
            { match: jest.fn(() => null), watch: jest.fn(() => {}) },
            { match: jest.fn(() => locales[1].id), act: jest.fn(() => {}) },
            { match: jest.fn(() => null), act: jest.fn(() => {}) },
        ];

        createManager(locales, policies);

        policies.forEach((policy) => policy?.act?.mockClear());

        const callback = policies[0].watch.mock.calls[0][0];

        policies[0].match = () => locales[0].id;
        callback(locales[0].id);

        expect(policies[1].act).toHaveBeenCalledTimes(1);
        expect(policies[1].act).toHaveBeenCalledWith(locales[0]);
        expect(policies[2].act).toHaveBeenCalledTimes(0);
    });

    it('should suspend the previous act()', async () => {
        const suspendAct = jest.fn();

        const policies = [
            { match: jest.fn(() => null), watch: jest.fn(() => {}) },
            { match: jest.fn(() => locales[1].id), act: jest.fn(() => suspendAct) },
            { match: jest.fn(() => null), act: jest.fn(() => {}) },
        ];

        createManager(locales, policies);

        const callback = policies[0].watch.mock.calls[0][0];

        policies[0].match = () => locales[0].id;
        callback(locales[0].id);

        expect(suspendAct).toHaveBeenCalledTimes(1);
    });

    it('should update current locale', () => {
        const policies = [
            { match: () => null, watch: jest.fn(() => {}) },
            { match: () => locales[1].id },
        ];

        const manager = createManager(locales, policies);

        const callback = policies[0].watch.mock.calls[0][0];

        policies[0].match = () => locales[0].id;
        callback(locales[0].id);

        expect(manager.locale).toBe(locales[0]);
    });

    it('should notify change listeners', () => {
        const policies = [
            { match: () => null, watch: jest.fn(() => {}) },
            { match: () => locales[1].id },
        ];

        const listener = jest.fn();
        const manager = createManager(locales, policies);

        manager.onLocaleChange(listener);

        const callback = policies[0].watch.mock.calls[0][0];

        policies[0].match = () => locales[0].id;
        callback(locales[0].id);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(locales[0]);
    });
});

describe('changeLocale()', () => {
    it('should fail if locale is unknown', async () => {
        const policies = [
            { match: () => locales[0].id },
            { match: () => locales[1].id },
        ];

        const manager = createManager(locales, policies);

        await expect(manager.changeLocale('it-IT')).rejects.toThrow('Unknown locale id: it-IT');
    });

    it('should save the new locale on the first policy that has the save() method', async () => {
        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[0].id), save: jest.fn(() => {}) },
            { match: jest.fn(() => locales[1].id), save: jest.fn(() => {}) },
        ];

        const manager = createManager(locales, policies);

        await manager.changeLocale(locales[1].id);

        expect(policies[1].save).toHaveBeenCalledTimes(1);
        expect(policies[1].save).toHaveBeenCalledWith(locales[1]);
        expect(policies[2].save).toHaveBeenCalledTimes(0);
    });

    it('should cancel previous save operation', async () => {
        const saveWithDelay = jest.fn(() => pDelay(250));
        const save = jest.fn(() => {});

        const policies = [
            { match: jest.fn(() => locales[0].id) },
            { match: jest.fn(() => locales[1].id), save: saveWithDelay },
            { match: jest.fn(() => locales[2].id) },
        ];

        const manager = createManager(locales, policies);
        let canceled;

        manager.changeLocale(locales[1].id)
        .catch((err) => {
            canceled = err.isCanceled;
        });

        await pDelay(50);
        policies[1].save = save;

        await manager.changeLocale(locales[2].id);

        await pDelay(300);

        expect(canceled).toBe(true);
        expect(saveWithDelay).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledTimes(1);
        expect(manager.locale).toBe(locales[2]);
    });

    it('should apply the locale on the first policy that has the act() method', async () => {
        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[0].id), act: jest.fn(() => {}) },
            { match: jest.fn(() => locales[1].id), act: jest.fn(() => {}) },
        ];

        const manager = createManager(locales, policies);

        policies.forEach((policy) => policy?.act?.mockClear());

        await manager.changeLocale(locales[1].id);

        expect(policies[1].act).toHaveBeenCalledTimes(1);
        expect(policies[1].act).toHaveBeenCalledWith(locales[1]);
        expect(policies[2].act).toHaveBeenCalledTimes(0);
    });

    it('should suspend the previous act()', async () => {
        const suspendAct = jest.fn();

        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[0].id), act: jest.fn(() => suspendAct) },
            { match: jest.fn(() => locales[1].id), act: jest.fn(() => {}) },
        ];

        const manager = createManager(locales, policies);

        await manager.changeLocale(locales[1].id);

        expect(suspendAct).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if locale is the same', async () => {
        const policies = [
            {
                match: () => locales[0].id,
                act: jest.fn(() => {}),
                save: jest.fn(() => pDelay(250)),
            },
        ];

        const manager = createManager(locales, policies);

        policies[0].act.mockClear();

        await manager.changeLocale(locales[0].id);

        expect(policies[0].act).toHaveBeenCalledTimes(0);
        expect(policies[0].save).toHaveBeenCalledTimes(0);
    });
});

describe('destroy()', () => {
    it('should suspend watching all policies', () => {
        const suspendWatch = jest.fn();

        const policies = locales.map(({ id }) => ({
            match: () => id,
            watch: jest.fn(() => suspendWatch),
        }));

        const manager = createManager(locales, policies);

        manager.destroy();

        expect(suspendWatch).toHaveBeenCalledTimes(locales.length);
    });

    it('should suspend the previous act()', async () => {
        const suspendAct = jest.fn();

        const policies = [
            { match: jest.fn(() => null) },
            { match: jest.fn(() => locales[0].id), act: jest.fn(() => suspendAct) },
            { match: jest.fn(() => locales[1].id), act: jest.fn(() => {}) },
        ];

        const manager = createManager(locales, policies);

        manager.destroy();

        expect(suspendAct).toHaveBeenCalledTimes(1);
    });
});
