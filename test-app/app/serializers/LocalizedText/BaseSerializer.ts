import { DreamSerializer } from '../../../../src/serializer/index.js'
import LocalizedText from '../../models/LocalizedText.js'

export const LocalizedTextBaseSerializer = ($data: LocalizedText) => DreamSerializer(LocalizedText, $data)

export function thisFunctionShouldNotBePartOfClientApiExport() {}
