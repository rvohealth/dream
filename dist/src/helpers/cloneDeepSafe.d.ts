/**
 * @internal
 *
 * accepts any value, and will return a valid clone of
 * that object. Any dream or query instances passed
 * will automatically be cloned using special cloning
 * methods.
 *
 * @param original - the value to clone
 * @param includePrimaryKey - Whether or not to copy the primary key when cloning a dream instance
 * @returns Either a clone, or else the original value
 */
export default function cloneDeepSafe(original: any): any;
