import DreamSerializer from '../../../../src/serializer/index.js'
import LocalizedText from '../../models/LocalizedText.js'

export class LocalizedTextBaseSerializer<DataType extends LocalizedText> extends DreamSerializer<DataType> {}

export function thisFunctionShouldNotBePartOfClientApiExport() {}
