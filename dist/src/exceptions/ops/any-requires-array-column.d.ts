import Dream from '../../dream';
export default class AnyRequiresArrayColumn extends Error {
    dreamClass: typeof Dream;
    column: string;
    constructor(dreamClass: typeof Dream, column: string);
    get message(): string;
}
