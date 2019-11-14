const addVary = (res, header) => {
    const vary = res.getHeader('Vary') || '';
    const varyParts = [...vary.split(/\s*,\s*/)].filter(Boolean);
    const varySet = new Set([...varyParts, header]);

    const newVary = Array.from(varySet).join(', ');

    res.setHeader('Vary', newVary);
};

export default addVary;
