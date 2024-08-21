"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MissingSerializersDefinition extends Error {
    constructor(dreamClass) {
        super();
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Missing serializers definition on the following class
Dream class: ${this.dreamClass.name}

Try something like this in your ${this.dreamClass.name}'s serializer getter:

class ${this.dreamClass.name} {
  public get serializers(): DreamSerializers<${this.dreamClass.name}> {
    return {
      default: '${this.dreamClass.name}Serializer'
    }
  }
  ...
}`;
    }
}
exports.default = MissingSerializersDefinition;
