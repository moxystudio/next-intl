import createPGroup from './p-group';
import pDelay from 'delay';
import PCancelable from 'p-cancelable';

it('should add promises and wait for them all', async () => {
    const pGroup = createPGroup();

    let waited = false;

    pGroup.add(pDelay(25));
    pGroup.add(pDelay(50));
    pGroup.add(pDelay(75));

    pGroup.wait()
        .then(() => {
            waited = true;
        });

    expect(waited).toBe(false);

    await pDelay(50);

    expect(waited).toBe(false);

    await pDelay(150);

    expect(waited).toBe(true);
});

it('should add non-promise values', async () => {
    const pGroup = createPGroup();

    let waited = false;

    pGroup.add('foo');
    pGroup.add(null);

    pGroup.wait()
        .then(() => {
            waited = true;
        });

    expect(waited).toBe(false);

    await pDelay(25);

    expect(waited).toBe(true);
});

it('should reset, canceling all ongoing promises', async () => {
    const pGroup = createPGroup();

    let canceled = false;

    pGroup.add(pDelay(25))
        .catch((err) => {
            canceled = err.isCanceled;
        });

    pGroup.reset();

    await pDelay(25);

    expect(canceled).toBe(true);
});

it('should accept cancelable promises', async () => {
    const pGroup = createPGroup();

    let canceled = false;
    const promise = new PCancelable((resolve, reject, onCancel) => {
        onCancel(() => {
            canceled = true;
        });
    });

    pGroup.add(promise)
        .catch(() => {});

    pGroup.reset();

    await pDelay(25);

    expect(canceled).toBe(true);
});
