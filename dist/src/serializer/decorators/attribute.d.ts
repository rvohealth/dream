import Dream from '../../dream';
import { RoundingPrecision } from '../../helpers/round';
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '../../openapi/types';
export default function Attribute(): any;
export default function Attribute<DreamClass extends typeof Dream>(dreamClass: DreamClass, openApiAndRenderOptions?: AutomaticOpenapiAndRenderOptions): any;
export default function Attribute(manualOpenapiOptions: OpenapiSchemaBodyShorthand, renderOptions?: AttributeRenderOptions): any;
export default function Attribute(shorthandAttribute: 'decimal' | 'decimal[]', openApiAndRenderOptions?: DecimalShorthandAttributeOpenapiAndRenderOptions): any;
export default function Attribute(shorthandAttribute: OpenapiShorthandPrimitiveTypes, openApiAndRenderOptions?: ShorthandAttributeOpenapiAndRenderOptions): any;
export type SerializableTypes = OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand;
export interface AttributeStatement {
    field: string;
    functional: boolean;
    openApiShape: OpenapiSchemaBodyShorthand;
    renderAs?: SerializableTypes;
    renderOptions?: AttributeRenderOptions;
}
interface OpenapiOnlyOptions {
    nullable?: boolean;
    description?: string;
}
interface AttributeRenderOptions {
    delegate?: string;
    precision?: RoundingPrecision;
}
type AutomaticOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'description'> & Pick<AttributeRenderOptions, 'precision'>;
type ShorthandAttributeOpenapiAndRenderOptions = Pick<OpenapiOnlyOptions, 'nullable' | 'description'> & Pick<AttributeRenderOptions, 'delegate'>;
type DecimalShorthandAttributeRenderOptions = Pick<AttributeRenderOptions, 'precision'>;
type DecimalShorthandAttributeOpenapiAndRenderOptions = ShorthandAttributeOpenapiAndRenderOptions & DecimalShorthandAttributeRenderOptions;
export {};
