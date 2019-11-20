import defaultPolicy from './default';

const locales = [
    { id: 'en-US', name: 'English' },
    { id: 'pt-PT', name: 'Português' },
];

describe('match()', () => {
    it('should return the default locale', () => {
        const policy = defaultPolicy('pt-PT');

        const locale = policy.match(locales, {});

        expect(locale).toBe('pt-PT');
    });

    it('should return null if default locale is not included in the supported locales', () => {
        const policy = defaultPolicy('it-IT');

        const locale = policy.match(locales, {});

        expect(locale).toBe(null);
    });
});

describe('WATCH()', () => {
    it('should not be present', () => {
        const policy = defaultPolicy();

        expect(policy).not.toHaveProperty('watch');
    });
});

describe('save()', () => {
    it('should not be present', () => {
        const policy = defaultPolicy();

        expect(policy).not.toHaveProperty('save');
    });
});

describe('act()', () => {
    it('should not be present', () => {
        const policy = defaultPolicy();

        expect(policy).not.toHaveProperty('act');
    });
});
