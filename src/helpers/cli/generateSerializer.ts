import path from 'path'
import generateSerializerString from './generateSerializerContent'
import fileWriter from '../fileWriter'
import absoluteFilePath from '../absoluteFilePath'
import { loadDreamYamlFile } from '../path'

export default async function generateSerializer(
  fullyQualifiedModelName: string,
  attributes: string[],
  {
    rootPath = absoluteFilePath(''),
  }: {
    rootPath?: string
  } = {}
) {
  const yamlConf = await loadDreamYamlFile()
  await fileWriter({
    filePath: fullyQualifiedModelName,
    filePostfix: 'Serializer',
    fileExtension: '.ts',
    pluralizeBeforePostfix: false,
    rootPath: path.join(rootPath, yamlConf.serializers_path),
    contentFunction: generateSerializerString,
    contentFunctionAttrs: [fullyQualifiedModelName, attributes],
  })
}
