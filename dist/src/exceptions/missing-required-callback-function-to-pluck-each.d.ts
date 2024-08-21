export default class MissingRequiredCallbackFunctionToPluckEach extends Error {
    private methodName;
    private args;
    constructor(methodName: string, providedArgs: any[]);
    get message(): string;
}
