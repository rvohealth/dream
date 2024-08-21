import { DreamSerializerAssociationStatement } from './decorators/associations/shared';
import { AttributeStatement } from './decorators/attribute';
export default class DreamSerializer<DataType = any, PassthroughDataType = any> {
    static attributeStatements: AttributeStatement[];
    static associationStatements: DreamSerializerAssociationStatement[];
    static readonly isDreamSerializer = true;
    private static _globalName;
    static get globalName(): string;
    private static setGlobalName;
    static get openapiName(): string;
    static render(data: any, opts?: DreamSerializerStaticRenderOpts): {
        [key: string]: any;
    };
    static renderArray(dataArr: any[], opts?: DreamSerializerStaticRenderOpts): {
        [key: string]: any;
    }[];
    static getAssociatedSerializersForOpenapi(associationStatement: DreamSerializerAssociationStatement): (typeof DreamSerializer<any, any>)[] | null;
    private static getAssociatedSerializerDuringRender;
    private _data;
    private _casing;
    readonly isDreamSerializerInstance = true;
    constructor(data: DataType);
    get data(): DataType;
    get attributes(): string[];
    casing(casing: 'snake' | 'camel'): this;
    protected passthroughData: PassthroughDataType;
    passthrough(obj: PassthroughDataType): this;
    render(): {
        [key: string]: any;
    };
    renderOne(): {
        [key: string]: any;
    };
    private numberOrStringToNumber;
    private computedRenderAs;
    private applyAssociation;
    private renderAssociation;
    private associatedData;
    private getAttributeValue;
    private applyCasingToField;
}
export interface DreamSerializerStaticRenderOpts {
    passthrough?: any;
}
export type SerializerPublicFields<I extends DreamSerializer> = keyof Omit<I, 'render' | 'passthrough' | 'renderOne' | 'casing' | 'attributes' | 'data' | 'attributeTypeReflection' | 'isDreamSerializerInstance'> & string;
