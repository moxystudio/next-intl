import picoSignals from 'pico-signals';
import createPGroup from './util/p-group';

const findLocaleById = (locales, localeId) => {
    const locale = locales.find(({ id }) => id === localeId);

    if (!locale) {
        throw new Error(`Unknown locale id: ${localeId}`);
    }

    return locale;
};

const match = (locales, policies, ctx = {}) => {
    const localeId = policies.reduce((localeId, policy) => localeId ?? policy.match(locales, ctx), null);

    if (!localeId) {
        throw new Error('None of the policies matched a locale.. did you forgot to include the default policy?');
    }

    return findLocaleById(locales, localeId);
};

const save = async (policies, locale) => {
    const policy = policies.find((policy) => policy.save);

    if (policy) {
        await policy.save(locale);
    }
};

const act = (policies, locale) => {
    let acted = false;

    return policies.reduce((suspendAct, policy) => {
        if (!acted && policy.act) {
            suspendAct = policy.act(locale);
            acted = true;
        }

        return suspendAct;
    }, null);
};

const watch = (policies, callback) => {
    const suspendWatchFns = policies.reduce((suspendWatchFns, policy) => {
        if (policy.watch) {
            suspendWatchFns.push(policy.watch(callback));
        }

        return suspendWatchFns;
    }, []);

    return () => {
        suspendWatchFns.forEach((suspend) => suspend());
    };
};

const getInitialData = async (locales, policies, ctx) => {
    if (typeof window !== 'undefined') {
        return;
    }

    const locale = match(locales, policies, ctx);
    const messages = await locale.loadMessages();

    return {
        localeId: locale.id,
        messages,
    };
};

const createManager = (locales, policies, initialData) => {
    let locale = findLocaleById(locales, initialData.localeId);
    let messages = initialData.messages;

    const changeSignal = picoSignals();
    const pGroup = createPGroup();
    let suspendWatch;
    let suspendAct;

    /* istanbul ignore else */
    if (typeof window !== 'undefined') {
        suspendAct = act(policies, locale);

        suspendWatch = watch(policies, async () => {
            try {
                const newLocale = match(locales, policies);

                if (newLocale.id === locale.id) {
                    return;
                }

                pGroup.reset();

                messages = await pGroup.add(locale.loadMessages());
                locale = newLocale;

                suspendAct && suspendAct();
                suspendAct = act(policies, locale);

                changeSignal.dispatch(locale);
            } catch (err) {
                if (!err.isCanceled) {
                    console.error(err);
                }
            }
        });
    }

    return {
        get locale() {
            return locale;
        },

        get messages() {
            return messages;
        },

        toData() {
            return {
                localeId: locale.id,
                messages,
            };
        },

        async changeLocale(localeId) {
            /* istanbul ignore if */
            if (typeof window === 'undefined') {
                throw new Error('This function can only be run on the client-side');
            }

            const newLocale = findLocaleById(locales, localeId);

            if (newLocale.id === locale.id) {
                await pGroup.wait();
            } else {
                pGroup.reset();

                messages = await pGroup.add(newLocale.loadMessages());
                locale = newLocale;

                suspendAct && suspendAct();
                suspendAct = act(policies, locale);

                changeSignal.dispatch(locale);

                await pGroup.add(save(policies, locale));
            }
        },

        onLocaleChange(fn) {
            changeSignal.add(fn);
        },

        destroy() {
            changeSignal.clear();
            pGroup.reset();
            suspendAct && suspendAct();
            suspendWatch && suspendWatch();
        },
    };
};

export default createManager;
export { getInitialData };
