import DreamSerializer from '../../../../src/serializer.js'
import LocalizedText from '../../models/LocalizedText.js'

export class LocalizedTextBaseSerializer<DataType extends LocalizedText> extends DreamSerializer<DataType> {}

export function thisFunctionShouldNotBePartOfClientApiExport() {}
