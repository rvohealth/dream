import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import LocalizedText from '../../models/LocalizedText.js'

export const LocalizedTextBaseSerializer = (data: LocalizedText) => DreamSerializer(LocalizedText, data)

export function thisFunctionShouldNotBePartOfClientApiExport() {}
