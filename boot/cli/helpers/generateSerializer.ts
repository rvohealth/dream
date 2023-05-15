import path from 'path'
import generateSerializerString from '../../../src/helpers/cli/generateSerializerContent'
import fileWriter from '../../../src/helpers/fileWriter'
import absoluteFilePath from '../../../src/helpers/absoluteFilePath'
import { loadDreamYamlFile } from '../../../src/helpers/path'

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
