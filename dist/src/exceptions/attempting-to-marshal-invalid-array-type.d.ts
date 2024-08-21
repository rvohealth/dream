export default class AttemptingToMarshalInvalidArrayType extends Error {
    given: any;
    constructor(given: any);
    get message(): string;
}
