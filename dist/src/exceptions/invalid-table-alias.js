"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InvalidTableAlias extends Error {
    constructor(tableAlias) {
        super();
        this.tableAlias = tableAlias;
    }
    get message() {
        return `
Invalid table alias passed to an underlying sql function.
table alias given:
  "${this.tableAlias}"

Table aliases must conform to a very basic shape, using only snake-cased alpha-numeric
aliases will be permitted, and they must not be an sql keyword

examples of GOOD table aliases:
  "users"
  "user_settings"

example of BAD table aliases:
  "users.settings"
  "user settings"
  "select"
  "truncate"
    `;
    }
}
exports.default = InvalidTableAlias;
