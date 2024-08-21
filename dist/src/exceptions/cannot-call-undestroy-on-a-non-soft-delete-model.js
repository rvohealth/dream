"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotCallUndestroyOnANonSoftDeleteModel extends Error {
    constructor(dreamClass) {
        super();
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Cannot call "undestroy" on a non-SoftDelete model. Ensure that your
model has @SoftDelete applied before calling "undestroy":

@SoftDelete()
class ${this.dreamClass.name} extends ApplicationModel {
  ...
}
    `;
    }
}
exports.default = CannotCallUndestroyOnANonSoftDeleteModel;
