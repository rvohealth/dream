export default class ScoreMustBeANormalNumber extends Error {
    score: number;
    constructor(score: number);
    get message(): string;
}
