import { DreamModelSerializer } from '../../../../src/serializer/index.js'
import LocalizedText from '../../models/LocalizedText.js'

export const LocalizedTextBaseSerializer = ($data: LocalizedText) =>
  DreamModelSerializer(LocalizedText, $data)

export function thisFunctionShouldNotBePartOfClientApiExport() {}
