"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const query_1 = __importDefault(require("./query"));
class LoadBuilder {
    /**
     * An intermediate class on the way to executing a load
     * query. this can be accessed on an instance of a dream
     * model by using the `#load` method:
     *
     * ```ts
     * const user = await User.firstOrFail()
     * await user.load('settings').execute()
     * ```
     */
    constructor(dream, txn) {
        this.dream = dream['clone']();
        // Load queries start from the table corresponding to an instance
        // of a Dream. However, the Dream may have default scopes that would
        // preclude finding that instance, so the Query that forms the base of
        // a load must be unscoped, but that unscoping should not carry through
        // to other associations (thus the use of `removeAllDefaultScopesExceptOnAssociations`
        // instead of `removeAllDefaultScopes`).
        this.query = new query_1.default(this.dream)['removeAllDefaultScopesExceptOnAssociations']();
        this.dreamTransaction = txn;
    }
    passthrough(passthroughWhereStatement) {
        this.query = this.query.passthrough(passthroughWhereStatement);
        return this;
    }
    /**
     * Attaches a load statement to the load builder
     *
     * ```ts
     * const user = await User.firstOrFail()
     * await user
     *   .load('settings')
     *   .load('posts', 'comments', 'replies', ['image', 'localizedText'])
     *   .execute()
     * ```
     */
    load(...args) {
        this.query = this.query.preload(...args);
        return this;
    }
    /**
     * executes a load builder query, binding
     * all associations to their respective model
     * instances.
     *
     * ```ts
     * const user = await User.firstOrFail()
     * await user
     *   .load('settings')
     *   .load('posts', 'comments', 'replies', ['image', 'localizedText'])
     *   .execute()
     * ```
     */
    async execute() {
        if (this.dreamTransaction) {
            this.query = this.query.txn(this.dreamTransaction);
        }
        await this.query['hydratePreload'](this.dream);
        return this.dream;
    }
}
exports.default = LoadBuilder;
