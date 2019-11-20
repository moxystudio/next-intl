import PCancelable from 'p-cancelable';

const createPGroup = () => {
    let promises = [];

    return {
        wait() {
            return Promise.all(promises);
        },
        add(promise) {
            if (typeof promise?.cancel !== 'function') {
                const originalPromise = Promise.resolve(promise);

                promise = new PCancelable((resolve, reject) => originalPromise.then(resolve, reject));
            }

            promises.push(promise);

            return promise;
        },
        reset() {
            promises.forEach((promise) => promise.cancel());
            promises = [];
        },
    };
};

export default createPGroup;
