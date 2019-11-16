import Cookies from 'universal-cookie';
import addVary from './util/vary';

const BROADCAST_CHANNEL_NAME = '__NEXT_INTL__';

const createPolicy = (options) => {
    options = {
        name: 'locale',
        ...options,
    };

    const uid = Math.round(Math.random() * (10 ** 17)).toString(36);

    return {
        match(locales, { req, res }) {
            const cookies = new Cookies(req?.headers.cookie);
            const localeId = cookies.get(options.name);

            const hasLocale = locales.some(({ id }) => id === localeId);

            if (!hasLocale) {
                return null;
            }

            if (typeof window === 'undefined') {
                addVary(res, 'Cookie');
            }

            return localeId;
        },

        watch(callback) {
            /* istanbul ignore if */
            if (typeof BroadcastChannel === 'undefined') {
                return () => {};
            }

            const broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

            broadcastChannel.addEventListener('message', ({ data }) => {
                if (data.uid !== uid) {
                    callback(data.localeId);
                }
            });

            return () => {
                broadcastChannel.close();
            };
        },

        save(locale) {
            const cookies = new Cookies();

            cookies.set(options.name, locale.id, options);

            const broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

            broadcastChannel.postMessage({ uid, localeId: locale.id });
            broadcastChannel.close();

            return true;
        },
    };
};

export default createPolicy;
