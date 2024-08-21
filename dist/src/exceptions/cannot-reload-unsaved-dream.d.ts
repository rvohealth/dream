import Dream from '../dream';
export default class CannotReloadUnsavedDream extends Error {
    private dream;
    constructor(dream: Dream);
    get message(): string;
}
