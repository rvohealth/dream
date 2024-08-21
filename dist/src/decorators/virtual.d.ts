import { SerializableTypes } from '../serializer/decorators/attribute';
export default function Virtual(type?: SerializableTypes): any;
export interface VirtualAttributeStatement {
    property: string;
    type?: SerializableTypes;
}
