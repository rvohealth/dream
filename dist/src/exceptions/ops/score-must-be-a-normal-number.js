"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScoreMustBeANormalNumber extends Error {
    constructor(score) {
        super();
        this.score = score;
    }
    get message() {
        return `
Attempting to pass a non-normal number to a similarity score in your query.
When passing a score, make sure it is a number between 0 and 1, i.e. 0.5
    provided score: ${this.score}
`;
    }
}
exports.default = ScoreMustBeANormalNumber;
