/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
 const isObject = item => (item && typeof item === 'object' && !Array.isArray(item));
    
/**
 * Deep merge two objects.
 * @param target
 * @param source
 */
const deepMerge = (target, source) => {
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    for (const key of Object.keys(source)) {
        if (isObject(source[key])) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    // Join `target` and modified `source`
    Object.assign(target || {}, source);
    return target;
}

module.exports = {
    isObject,
    deepMerge,
};
