import path from 'path'
import generateSerializerString from '../helpers/cli/generateSerializerContent'
import fileWriter from '../helpers/fileWriter'
import absoluteFilePath from '../helpers/absoluteFilePath'
import { loadDreamYamlFile } from '../helpers/path'

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
