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
        if (target[key] && isObject(source[key])) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    // Join `target` and modified `source`
    Object.assign(target || {}, source);
    return target;
}

/**
 * Converts a value into an array
 * 
 * @param value
 * 
 * @returns {boolean}
 */
const arrayTypeCast = (value) => {
    // Check whether the string has the array pattern [string, string, string]
    const arrayDetected = value.match(/^\[(.*?)\]$/);

    if (arrayDetected && arrayDetected.length > 0) {
        // We remove the brackets and build an array of elements
        const arrayContent = arrayDetected[0].replace(/[\[\]']+/g, '').split(',');
        return arrayContent.map(el => el.trim());
    }

    // If no array pattern match found it defaults to an empty array
    return [];
}

/**
 * Converts a value into a boolean
 * 
 * @param value
 * 
 * @returns {boolean}
 */
 const boolTypeCast = (value) => {
    const falsyStrings = ['0', 'false'];
    if (falsyStrings.includes(lowerCase(value))) {
        return false;
    }
    return Boolean(value);
}

/**
 * Converts a given value to the required type, defaults to string type
 * 
 * @param value the value to convert
 * @param type the desired type (accepts: str, string, int, integer, bool, boolean, arr, array)
 * 
 * @returns {string|integer|boolean|array}
 */
const typeCast = (value, type) => {
    switch (type) {
        case 'str':
        case 'string':
            return String(value);
        case 'int':
        case 'integer':
            return Number(value);
        case 'bool':
        case 'boolean':
            return boolTypeCast(value);
        case 'arr':
        case 'array':
            return arrayTypeCast(value);
        default:
            console.log(`Type ${type} is not recognized (allowed type: string, integer, bool, array). Defaulting to string type`);
            return String(value);
    };
}

module.exports = {
    isObject,
    deepMerge,
    typeCast,
};
