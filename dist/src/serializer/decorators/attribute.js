"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typechecks_1 = require("../../helpers/typechecks");
const dreamAttributeOpenapiShape_1 = require("./helpers/dreamAttributeOpenapiShape");
/*
 * Used to indicate which properties or methods on a
 * serializer should be returned when rendering this
 * serializer.
 *
 * When calling the @Attribute decorator, the first
 * argument passed is used to inform psychic of the
 * intended return shape. The api for the UserSerializer
 * class is a shorthand hybrid of the openapi spec.
 *
 * You are able to pass types directly like so:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute('string')
 *   public email: string
 * }
 * ```
 *
 * And can also easily communicate array types:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute('decimal[]')
 *   public scores: number[]
 * }
 * ```
 *
 * For more complex types, utilize the openapi
 * shorthand api provided by dream to communicate
 * the custom payload shape:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute({
 *     first: 'string',
 *     last: {
 *       type: 'string',
 *       nullable: true,
 *     },
 *   })
 *   public name: { first: string; last: number | null }
 * }
 * ```
 *
 * You are able to use advanced openapi types
 * to communicate complex possibilities:
 *
 * ```ts
 * class UserSerializer extends DreamSerializer {
 *   @Attribute({
 *     anyOf: [
 *       {
 *         type: 'object',
 *         properties: {
 *           first: 'string',
 *           last: {
 *             type: 'string',
 *             nullable: true,
 *           },
 *         }
 *       },
 *       {
 *         type: 'string',
 *         nullable: true,
 *       },
 *       {
 *         $schema: 'UserName'
 *       }
 *     ]
 *   })
 *   public name: any
 * }
 * ```
 */
function Attribute(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions, openApiAndRenderOptions_or_renderOptions = {}) {
    return function (target, key, def) {
        const serializerClass = target.constructor;
        let renderAs;
        let openApiShape;
        const { openApiOptions, renderOptions } = openApiAndRenderOptionsToSeparateOptions(openApiAndRenderOptions_or_renderOptions);
        if (dreamClass_or_shorthandAttribute_or_manualOpenapiOptions?.isDream) {
            openApiShape = {
                ...(0, dreamAttributeOpenapiShape_1.dreamAttributeOpenapiShape)(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions, key),
                ...openApiOptions,
            };
            //
        }
        else if ((0, typechecks_1.isString)(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions)) {
            renderAs = dreamClass_or_shorthandAttribute_or_manualOpenapiOptions;
            openApiShape = { type: renderAs, ...openApiOptions };
            //
        }
        else if (typeof dreamClass_or_shorthandAttribute_or_manualOpenapiOptions === 'object') {
            openApiShape = dreamClass_or_shorthandAttribute_or_manualOpenapiOptions;
            renderAs = openApiShape;
        }
        else if (dreamClass_or_shorthandAttribute_or_manualOpenapiOptions === undefined) {
            // no-op
        }
        else {
            throw new Error(`
Unrecognized first argument to @Attriute decorator: ${JSON.stringify(dreamClass_or_shorthandAttribute_or_manualOpenapiOptions)}
Serializer: ${serializerClass.name}
Attribute: ${key}
`);
        }
        serializerClass.attributeStatements = [
            ...(serializerClass.attributeStatements || []),
            {
                field: key,
                functional: typeof def?.value === 'function',
                openApiShape,
                renderAs,
                renderOptions,
            },
        ];
    };
}
exports.default = Attribute;
function openApiAndRenderOptionsToSeparateOptions(openApiAndRenderOptions) {
    let openApiOptions;
    let renderOptions;
    if (openApiAndRenderOptions.description !== undefined) {
        openApiOptions ||= {};
        openApiOptions.description = openApiAndRenderOptions.description;
    }
    if (openApiAndRenderOptions.nullable !== undefined) {
        openApiOptions ||= {};
        openApiOptions.nullable = openApiAndRenderOptions.nullable;
    }
    if (openApiAndRenderOptions.delegate !== undefined) {
        renderOptions ||= {};
        renderOptions.delegate = openApiAndRenderOptions.delegate;
    }
    if (openApiAndRenderOptions.precision !== undefined) {
        renderOptions ||= {};
        renderOptions.precision = openApiAndRenderOptions.precision;
    }
    return { openApiOptions, renderOptions };
}
