"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_application_1 = __importDefault(require("../../dream-application"));
class FailedToIdentifyAssociation extends Error {
    constructor(modelClass, associationType, associationName, globalAssociationNameOrNames) {
        super();
        this.modelClass = modelClass;
        this.associationType = associationType;
        this.associationName = associationName;
        this.globalAssociationNameOrNames = globalAssociationNameOrNames;
    }
    get message() {
        const dreamApp = dream_application_1.default.getOrFail();
        const attemptedName = Array.isArray(this.globalAssociationNameOrNames)
            ? this.globalAssociationNameOrNames[0]
            : this.globalAssociationNameOrNames;
        if (typeof attemptedName !== 'string') {
            return `
An unexpected error occurred while looking up an association that you have defined.

While building the schema for your app, we failed to find a match for
the ${this.associationType} association "${this.associationName}" on the
${this.modelClass.name} model.

This method requires either a string or string array as the first argument,
to the ${this.associationType} decorator. However, we received the following:

  expected:
    "string"

  received:
    "${typeof attemptedName}"

Details:
    dream: ${this.modelClass.name} (${this.modelClass.globalName})
    association type: ${this.associationType}
    association name: ${this.associationName}
".
`;
        }
        const possibleMatches = Object.keys(dreamApp.models).filter(globalName => new RegExp(attemptedName.slice(0, Math.min(attemptedName.length, 8)), 'i').test(globalName.replace(/\//g, '')));
        const possibleMatchesMessage = possibleMatches.length
            ? `\
Did you by chance mean one of these associations?:
    ${possibleMatches.join('\n    ')}`
            : '';
        return `
An unexpected error occurred while looking up an association that you have defined.

While building the schema for your app, we failed to find a match for
the ${this.associationType} association "${this.associationName}"
on ${this.modelClass.name}, using the global model name "${attemptedName}".

Usually, this is because the global name for
the model is not what you anticipated, which often happens when you are
using models that are in nested directories, since their names can be
counter-intuitive.

We recommend that you lean into the autocomplete when providing the
first argument to an association, since it can help to catch these
familiar gotchas.

Details:
    dream: ${this.modelClass.name} (${this.modelClass.globalName})
    association type: ${this.associationType}
    association name: ${this.associationName}
    attempted model name: ${attemptedName}

${possibleMatchesMessage}

Here is a complete list of possible associations:
    ${Object.keys(dreamApp.models).join(',\n    ')}
`;
    }
}
exports.default = FailedToIdentifyAssociation;
