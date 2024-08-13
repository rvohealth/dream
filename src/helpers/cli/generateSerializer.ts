import path from 'path'
import absoluteFilePath from '../absoluteFilePath'
import fileWriter from '../fileWriter'
import dreamPath from '../path/dreamPath'
import generateSerializerString from './generateSerializerContent'

export default async function generateSerializer(
  fullyQualifiedModelName: string,
  attributes: string[],
  {
    rootPath = absoluteFilePath(''),
  }: {
    rootPath?: string
  } = {}
) {
  await fileWriter({
    filePath: fullyQualifiedModelName,
    filePostfix: 'Serializer',
    fileExtension: '.ts',
    pluralizeBeforePostfix: false,
    rootPath: path.join(rootPath, await dreamPath('serializers')),
    contentFunction: generateSerializerString,
    contentFunctionAttrs: [fullyQualifiedModelName, attributes],
  })
}
