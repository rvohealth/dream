"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_isarray_1 = __importDefault(require("lodash.isarray"));
const luxon_1 = require("luxon");
const types_1 = require("../dream/types");
const non_loaded_association_1 = __importDefault(require("../exceptions/associations/non-loaded-association"));
const global_name_not_set_1 = __importDefault(require("../exceptions/dream-application/global-name-not-set"));
const missing_serializers_definition_1 = __importDefault(require("../exceptions/missing-serializers-definition"));
const failed_to_render_through_association_1 = __importDefault(require("../exceptions/serializers/failed-to-render-through-association"));
const camelize_1 = __importDefault(require("../helpers/camelize"));
const compact_1 = __importDefault(require("../helpers/compact"));
const inferSerializerFromDreamOrViewModel_1 = __importStar(require("../helpers/inferSerializerFromDreamOrViewModel"));
const round_1 = __importDefault(require("../helpers/round"));
const snakeify_1 = __importDefault(require("../helpers/snakeify"));
const maybeSerializableToDreamSerializerCallbackFunction_1 = __importDefault(require("./decorators/helpers/maybeSerializableToDreamSerializerCallbackFunction"));
class DreamSerializer {
    static get globalName() {
        if (!this._globalName)
            throw new global_name_not_set_1.default(this);
        return this._globalName;
    }
    static setGlobalName(globalName) {
        this._globalName = globalName;
    }
    static get openapiName() {
        // TODO: make this customizable by the user
        const pathDelimiter = '_';
        return this.name.replace(/Serializer$/, '').replace(/\//g, pathDelimiter);
    }
    static render(data, opts = {}) {
        return new this(data).passthrough(opts.passthrough).render();
    }
    static renderArray(dataArr, opts = {}) {
        return dataArr.map(data => this.render(data, opts));
    }
    static getAssociatedSerializersForOpenapi(associationStatement) {
        const serializer = (0, maybeSerializableToDreamSerializerCallbackFunction_1.default)(associationStatement.dreamOrSerializerClass);
        if (serializer)
            return [serializer()];
        let classOrClasses = associationStatement.dreamOrSerializerClass;
        if (!classOrClasses)
            return null;
        if (!Array.isArray(classOrClasses)) {
            classOrClasses = [classOrClasses];
        }
        return (0, compact_1.default)(classOrClasses.map(klass => (0, inferSerializerFromDreamOrViewModel_1.inferSerializerFromDreamClassOrViewModelClass)(klass, associationStatement.serializerKey)));
    }
    static getAssociatedSerializerDuringRender(associatedData, associationStatement) {
        const dreamSerializerCallbackFunctionOrNull = (0, maybeSerializableToDreamSerializerCallbackFunction_1.default)(associationStatement.dreamOrSerializerClass);
        if (dreamSerializerCallbackFunctionOrNull)
            return dreamSerializerCallbackFunctionOrNull();
        return (0, inferSerializerFromDreamOrViewModel_1.default)(associatedData, associationStatement.serializerKey);
    }
    constructor(data) {
        this._casing = null;
        this.isDreamSerializerInstance = true;
        this.passthroughData = {};
        this._data = data;
        const attributeStatements = [...this.constructor.attributeStatements];
        attributeStatements.forEach(attributeStatement => {
            if (!attributeStatement.functional) {
                if (!Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), attributeStatement.field)?.get) {
                    Object.defineProperty(Object.getPrototypeOf(this), attributeStatement.field, {
                        get() {
                            return this.data[attributeStatement.field];
                        },
                        set(val) {
                            this.data[attributeStatement.field] = val;
                        },
                    });
                }
            }
        });
    }
    get data() {
        return this._data;
    }
    get attributes() {
        const attributes = [...this.constructor.attributeStatements.map(s => s.field)];
        switch (this._casing) {
            case 'camel':
                return attributes.map(attr => (0, camelize_1.default)(attr));
            case 'snake':
                return attributes.map(attr => (0, snakeify_1.default)(attr));
            default:
                return attributes;
        }
    }
    casing(casing) {
        this._casing = casing;
        return this;
    }
    passthrough(obj) {
        this.passthroughData = {
            ...this.passthroughData,
            ...obj,
        };
        return this;
    }
    render() {
        if (!this._casing) {
            this._casing = process.env['SERIALIZER_CASING'] || 'camel';
        }
        return this.renderOne();
    }
    renderOne() {
        let returnObj = {};
        for (const associationStatement of this.constructor.associationStatements) {
            if (associationStatement.flatten) {
                returnObj = {
                    ...returnObj,
                    ...this.applyAssociation(associationStatement),
                };
            }
            else {
                returnObj[this.applyCasingToField(associationStatement.field)] =
                    this.applyAssociation(associationStatement);
            }
        }
        this.attributes.forEach(attr => {
            const attributeStatement = this.constructor.attributeStatements.find(s => [attr, this.applyCasingToField(attr)].includes(s.field) ||
                [attr, this.applyCasingToField(attr)].includes(this.applyCasingToField(s.field)));
            if (attributeStatement) {
                const { field, renderAs, renderOptions } = attributeStatement;
                const fieldWithCasing = this.applyCasingToField(field);
                let dateValue;
                let decimalValue;
                switch (this.computedRenderAs(renderAs)) {
                    case 'date':
                        dateValue = this.getAttributeValue(attributeStatement);
                        returnObj[fieldWithCasing] = dateValue?.toISODate() || null;
                        break;
                    case 'date-time':
                        dateValue = this.getAttributeValue(attributeStatement);
                        returnObj[fieldWithCasing] = dateValue?.toISO()
                            ? luxon_1.DateTime.fromISO(dateValue.toISO()).toISO()
                            : null;
                        break;
                    case 'decimal':
                        decimalValue = this.numberOrStringToNumber(this.getAttributeValue(attributeStatement));
                        returnObj[fieldWithCasing] =
                            decimalValue === null
                                ? null
                                : renderOptions?.precision === undefined
                                    ? decimalValue
                                    : (0, round_1.default)(decimalValue, renderOptions?.precision);
                        break;
                    case 'integer':
                        decimalValue = this.numberOrStringToNumber(this.getAttributeValue(attributeStatement));
                        returnObj[fieldWithCasing] = decimalValue === null ? null : (0, round_1.default)(decimalValue);
                        break;
                    default:
                        returnObj[fieldWithCasing] = this.getAttributeValue(attributeStatement);
                }
            }
        });
        return returnObj;
    }
    numberOrStringToNumber(num) {
        if (num === undefined)
            return null;
        if (num === null)
            return null;
        if (typeof num === 'number')
            return num;
        return Number(num);
    }
    computedRenderAs(renderAs) {
        if (typeof renderAs === 'object') {
            const safeRenderAs = renderAs;
            if (safeRenderAs.type === 'string' || safeRenderAs.type === 'number') {
                if (safeRenderAs.format)
                    return safeRenderAs.format;
                return safeRenderAs.type;
            }
            if (safeRenderAs.type)
                return safeRenderAs.type;
        }
        return renderAs;
    }
    applyAssociation(associationStatement) {
        // let associatedData: ReturnType<DreamSerializer.prototype.associatedData>
        let associatedData;
        try {
            associatedData = this.associatedData(associationStatement);
        }
        catch (error) {
            if (error.constructor !== non_loaded_association_1.default)
                throw error;
            if (associationStatement.optional)
                return undefined;
            throw error;
        }
        if (associationStatement.type === 'RendersMany' && Array.isArray(associatedData))
            return associatedData.map(d => this.renderAssociation(d, associationStatement));
        else if (associatedData)
            return this.renderAssociation(associatedData, associationStatement);
        return associationStatement.type === 'RendersMany' ? [] : null;
    }
    renderAssociation(associatedData, associationStatement) {
        const SerializerClass = DreamSerializer.getAssociatedSerializerDuringRender(associatedData, associationStatement);
        if (!SerializerClass)
            throw new missing_serializers_definition_1.default(associatedData.constructor);
        return new SerializerClass(associatedData).passthrough(this.passthroughData).render();
    }
    associatedData(associationStatement) {
        const delegateToPassthroughData = associationStatement.source === types_1.DreamConst.passthrough;
        let self = (delegateToPassthroughData ? this.passthroughData : this.data);
        if (associationStatement.through) {
            const throughField = associationStatement.through;
            if ((0, lodash_isarray_1.default)(self)) {
                self = self.flatMap(singleField => singleField[throughField]);
            }
            else {
                self = self[throughField];
            }
            if (self === undefined) {
                throw new failed_to_render_through_association_1.default(this.constructor.name, throughField);
            }
        }
        if ((0, lodash_isarray_1.default)(self)) {
            return self.flatMap(item => {
                let returnValue;
                if (delegateToPassthroughData)
                    returnValue = item[associationStatement.field];
                returnValue = item[associationStatement.source];
                return (0, lodash_isarray_1.default)(returnValue) ? returnValue.flat() : returnValue;
            });
        }
        else {
            if (delegateToPassthroughData)
                return self[associationStatement.field];
            return self[associationStatement.source];
        }
    }
    getAttributeValue(attributeStatement) {
        const { field } = attributeStatement;
        let pathToValue = this;
        if (attributeStatement.renderOptions?.delegate) {
            const delegateField = attributeStatement.renderOptions?.delegate;
            pathToValue = this.data?.[delegateField] || null;
        }
        const valueOrCb = pathToValue[field];
        if (attributeStatement.functional) {
            return valueOrCb.call(this, this.data);
        }
        else {
            return valueOrCb;
        }
    }
    applyCasingToField(field) {
        switch (this._casing) {
            case 'camel':
                return (0, camelize_1.default)(field);
            case 'snake':
                return (0, snakeify_1.default)(field);
            default:
                return field;
        }
    }
}
DreamSerializer.attributeStatements = [];
DreamSerializer.associationStatements = [];
DreamSerializer.isDreamSerializer = true;
exports.default = DreamSerializer;
