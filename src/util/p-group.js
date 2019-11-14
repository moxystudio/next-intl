import PCancelable from 'p-cancelable';

const createPGroup = () => {
    const promises = [];

    return {
        wait() {
            return Promise.all(promises);
        },
        add: (promise) => {
            promise = Promise.resolve(promise);

            if (typeof promise.cancel !== 'function') {
                const originalPromise = promise;

                promise = new PCancelable((resolve, reject) => originalPromise.then(resolve, reject));
            }

            promises.push(promise);

            return promise;
        },
        cancel: () => {
            promises.forEach((promise) => promise.cancel());
        },
    };
};

export default createPGroup;
