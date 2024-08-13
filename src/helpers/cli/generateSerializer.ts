import path from 'path'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'
import fileWriter from '../fileWriter'
import relativeDreamPath from '../path/dreamPath'
import generateSerializerString from './generateSerializerContent'

export default async function generateSerializer(
  fullyQualifiedModelName: string,
  attributes: string[],
  {
    rootPath,
  }: {
    rootPath?: string
  } = {}
) {
  const dreamApp = getCachedDreamApplicationOrFail()

  await fileWriter({
    filePath: fullyQualifiedModelName,
    filePostfix: 'Serializer',
    fileExtension: '.ts',
    pluralizeBeforePostfix: false,
    rootPath: path.join(rootPath || dreamApp.appRoot, relativeDreamPath('serializers')),
    contentFunction: generateSerializerString,
    contentFunctionAttrs: [fullyQualifiedModelName, attributes],
  })
}
