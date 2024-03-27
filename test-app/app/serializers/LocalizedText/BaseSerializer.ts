import DreamSerializer from '../../../../src/serializer'
import LocalizedText from '../../models/LocalizedText'

export class LocalizedTextBaseSerializer<DataType extends LocalizedText> extends DreamSerializer<DataType> {}

export function thisFunctionShouldNotBePartOfClientApiExport() {}
