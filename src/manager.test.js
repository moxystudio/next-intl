import pDelay from 'delay';
import createManager, { getInitialData } from './manager';
import createPGroup from './util/p-group';

jest.mock('./util/p-group', () => jest.fn(() => ({
    wait: jest.fn(),
    add: jest.fn(),
    reset: jest.fn(),
})));

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
    createPGroup.mockClear();
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
            { match: jest.fn(() => locales[0].id) },
            { match: jest.fn(() => locales[1].id) },
        ];

        const initialData = await getInitialData(locales, policies);

        expect(initialData).toBe(undefined);

        policies.forEach((policy) => expect(policy.match).toHaveBeenCalledTimes(0));
        locales.forEach((locales) => expect(locales.loadMessages).toHaveBeenCalledTimes(0));
    });
});

describe('manager', () => {
    describe('init', () => {
        it('should start with the initialData', async () => {
            const policies = [
                { match: jest.fn(() => locales[0].id) },
                { match: jest.fn(() => locales[1].id) },
            ];

            const initialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            const manager = createManager(locales, policies, initialData);

            expect(manager.locale.id).toBe(initialData.localeId);
            expect(manager.messages).toBe(initialData.messages);

            policies.forEach((policy) => expect(policy.match).toHaveBeenCalledTimes(0));
            locales.forEach((locales) => expect(locales.loadMessages).toHaveBeenCalledTimes(0));
        });

        it('should throw if the initial locale does not exist', () => {
            const initialData = {
                localeId: 'it-IT',
                messages: {},
            };

            expect(() => createManager(locales, [], initialData))
            .toThrow('Unknown locale id: it-IT');
        });

        it('should watch all policies', () => {
            const policies = locales.map(({ id }) => ({
                match: () => id,
                watch: jest.fn(),
            }));

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            createManager(locales, policies, initialData);

            policies.forEach((policy) => expect(policy.watch).toHaveBeenCalledTimes(1));
        });

        it('should apply the locale on the first policy that has the act() method', () => {
            const policies = [
                { match: jest.fn(() => null), watch: jest.fn() },
                { match: jest.fn(() => locales[1].id), act: jest.fn() },
                { match: jest.fn(() => locales[0].id), act: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            createManager(locales, policies, initialData);

            expect(policies[1].act).toHaveBeenCalledTimes(1);
            expect(policies[1].act).toHaveBeenCalledWith(locales[0]);
            expect(policies[2].act).toHaveBeenCalledTimes(0);
        });
    });

    describe('policy invoked watch callback', () => {
        beforeAll(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            console.error.mockClear();
        });

        afterAll(() => {
            console.error.mockRestore();
        });

        it('should iterate all policies, until one matches a locale', () => {
            const policies = [
                { match: jest.fn(() => null) },
                { match: jest.fn(() => locales[0].id) },
                { match: jest.fn(() => null), watch: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            createManager(locales, policies, initialData);

            const callback = policies[2].watch.mock.calls[0][0];

            policies.forEach(({ match }) => match.mockClear());
            policies.match = jest.fn(() => locales[1].id);
            callback(locales[1].id);

            expect(policies[0].match).toHaveBeenCalledTimes(1);
            expect(policies[1].match).toHaveBeenCalledTimes(1);
            expect(policies[2].match).toHaveBeenCalledTimes(0);
        });

        it('should apply the locale on the first policy that has the act() method', async () => {
            const policies = [
                { match: jest.fn(() => null), watch: jest.fn() },
                { match: jest.fn(() => locales[1].id), act: jest.fn() },
                { match: jest.fn(() => null), act: jest.fn() },
            ];

            const initialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            createManager(locales, policies, initialData);

            policies.forEach((policy) => policy.act?.mockClear());

            const callback = policies[0].watch.mock.calls[0][0];

            policies[0].match = () => locales[0].id;
            callback(locales[0].id);

            await pDelay(15);

            expect(policies[1].act).toHaveBeenCalledTimes(1);
            expect(policies[1].act).toHaveBeenCalledWith(locales[0]);
            expect(policies[2].act).toHaveBeenCalledTimes(0);
        });

        it('should suspend the previous act()', async () => {
            const suspendAct = jest.fn();

            const policies = [
                { match: jest.fn(() => null), watch: jest.fn() },
                { match: jest.fn(() => locales[1].id), act: jest.fn(() => suspendAct) },
                { match: jest.fn(() => null), act: jest.fn() },
            ];

            const initialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            createManager(locales, policies, initialData);

            const callback = policies[0].watch.mock.calls[0][0];

            policies[0].match = () => locales[0].id;
            callback(locales[0].id);

            await pDelay(15);

            expect(suspendAct).toHaveBeenCalledTimes(1);
        });

        it('should update current locale', async () => {
            const policies = [
                { match: () => null, watch: jest.fn() },
                { match: () => locales[1].id },
            ];

            const initialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            const manager = createManager(locales, policies, initialData);

            const callback = policies[0].watch.mock.calls[0][0];

            policies[0].match = () => locales[0].id;
            callback(locales[0].id);

            await pDelay(15);

            expect(manager.locale).toBe(locales[0]);
        });

        it('should notify change listeners', async () => {
            const policies = [
                { match: () => null, watch: jest.fn() },
                { match: () => locales[1].id },
            ];

            const initialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            const listener = jest.fn();
            const manager = createManager(locales, policies, initialData);

            manager.onLocaleChange(listener);

            const callback = policies[0].watch.mock.calls[0][0];

            policies[0].match = () => locales[0].id;
            callback(locales[0].id);

            await pDelay(15);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(locales[0]);
        });

        it('should fail if locale does not exist', async () => {
            const policies = [
                { match: () => locales[0].id, watch: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const listener = jest.fn();
            const manager = createManager(locales, policies, initialData);

            manager.onLocaleChange(listener);

            const callback = policies[0].watch.mock.calls[0][0];

            policies[0].match = () => 'it-IT';
            callback('it-IT');

            await pDelay(15);

            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith(new Error('Unknown locale id: it-IT'));
        });

        it('should fail if none of the policies matched', async () => {
            const policies = [
                { match: () => null, watch: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const listener = jest.fn();
            const manager = createManager(locales, policies, initialData);

            manager.onLocaleChange(listener);

            const callback = policies[0].watch.mock.calls[0][0];

            callback('it-IT');

            await pDelay(15);

            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith(
                new Error('None of the policies matched a locale.. did you forgot to include the default policy?'),
            );
        });

        it('should cancel ongoing async operations', async () => {
            const policies = [
                { match: () => null, watch: jest.fn() },
                { match: () => locales[1].id },
            ];

            const initialData = {
                localeId: locales[1].id,
                messages: messages[locales[1].id],
            };

            const listener = jest.fn();
            const manager = createManager(locales, policies, initialData);

            manager.onLocaleChange(listener);

            const callback = policies[0].watch.mock.calls[0][0];

            policies[0].match = () => locales[0].id;
            callback(locales[0].id);

            await pDelay(15);

            const pGroup = createPGroup.mock.results[0].value;

            expect(pGroup.add).toHaveBeenCalledTimes(1);
            expect(pGroup.reset).toHaveBeenCalledTimes(1);
        });
    });
    describe('toData()', () => {
        it('should return the localeId and messages', () => {
            const policies = [
                { match: locales[0].id },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            expect(manager.toData()).toEqual(initialData);
        });
    });

    describe('changeLocale()', () => {
        it('should fail if locale does not exist', async () => {
            const policies = [
                { match: () => locales[0].id },
                { match: () => locales[1].id },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            await expect(manager.changeLocale('it-IT')).rejects.toThrow('Unknown locale id: it-IT');
        });

        it('should save the new locale on the first policy that has the save() method', async () => {
            const policies = [
                { match: jest.fn(() => null) },
                { match: jest.fn(() => locales[0].id), save: jest.fn() },
                { match: jest.fn(() => locales[1].id), save: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            await manager.changeLocale(locales[1].id);

            expect(policies[1].save).toHaveBeenCalledTimes(1);
            expect(policies[1].save).toHaveBeenCalledWith(locales[1]);
            expect(policies[2].save).toHaveBeenCalledTimes(0);
        });

        it('should cancel ongoing async operations', async () => {
            const policies = [
                { match: jest.fn(() => null) },
                { match: jest.fn(() => locales[0].id), save: jest.fn() },
                { match: jest.fn(() => locales[1].id), save: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            await manager.changeLocale(locales[1].id);

            const pGroup = createPGroup.mock.results[0].value;

            expect(pGroup.add).toHaveBeenCalledTimes(2);
            expect(pGroup.reset).toHaveBeenCalledTimes(1);
        });

        it('should apply the locale on the first policy that has the act() method', async () => {
            const policies = [
                { match: jest.fn(() => null) },
                { match: jest.fn(() => locales[0].id), act: jest.fn() },
                { match: jest.fn(() => locales[1].id), act: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            policies.forEach((policy) => policy.act?.mockClear());

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
                { match: jest.fn(() => locales[1].id), act: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            await manager.changeLocale(locales[1].id);

            expect(suspendAct).toHaveBeenCalledTimes(1);
        });

        it('should do nothing if locale is the same', async () => {
            const policies = [
                {
                    match: () => locales[0].id,
                    act: jest.fn(),
                    save: jest.fn(() => pDelay(250)),
                },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

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

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            manager.destroy();

            expect(suspendWatch).toHaveBeenCalledTimes(locales.length);
        });

        it('should suspend the previous act()', async () => {
            const suspendAct = jest.fn();

            const policies = [
                { match: jest.fn(() => null) },
                { match: jest.fn(() => locales[0].id), act: jest.fn(() => suspendAct) },
                { match: jest.fn(() => locales[1].id), act: jest.fn() },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            manager.destroy();

            expect(suspendAct).toHaveBeenCalledTimes(1);
        });

        it('should cancel ongoing async operations', () => {
            const policies = [
                { match: jest.fn(() => locales[0].id) },
            ];

            const initialData = {
                localeId: locales[0].id,
                messages: messages[locales[0].id],
            };

            const manager = createManager(locales, policies, initialData);

            const pGroup = createPGroup.mock.results[0].value;

            manager.destroy();

            expect(pGroup.reset).toHaveBeenCalledTimes(1);
        });
    });
});
