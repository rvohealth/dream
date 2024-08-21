import Dream from '../../dream';
export default class STIChildMissing extends Error {
    baseDreamClass: typeof Dream;
    extendingDreamClassName: string;
    primaryKeyValue: any;
    constructor(baseDreamClass: typeof Dream, extendingDreamClassName: string, primaryKeyValue: any);
    get message(): string;
}
