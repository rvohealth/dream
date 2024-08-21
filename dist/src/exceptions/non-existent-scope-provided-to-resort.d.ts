import Dream from '../dream';
export default class NonExistentScopeProvidedToResort extends Error {
    private scopes;
    private dreamClass;
    constructor(scopes: string[], dreamClass: typeof Dream);
    get message(): string;
}
