import addVary from './vary';

it('should set Vary header correctly when undefined', () => {
    const res = {
        getHeader: () => undefined,
        setHeader: jest.fn(() => {}),
    };

    addVary(res, 'Accept-Language');

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Accept-Language');
});

it('should set Vary header correctly when already defined', () => {
    const res = {
        getHeader: () => 'Cookie',
        setHeader: jest.fn(() => {}),
    };

    addVary(res, 'Accept-Language');

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Cookie, Accept-Language');
});

it('should remove duplicates', () => {
    const res = {
        getHeader: () => 'Cookie',
        setHeader: jest.fn(() => {}),
    };

    addVary(res, 'Cookie');

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Cookie');
});
