import fs from 'fs/promises'
import { loadDreamYamlFile, projectRootPath } from '../path'
import generateApiSchemaContent from './generateApiSchemaContent'

export default async function generateApiSchema() {
  const yamlConf = await loadDreamYamlFile()
  const fileContents = await generateApiSchemaContent()

  const filePath = projectRootPath({ filepath: yamlConf.client_schema_path })
  await fs.writeFile(filePath, fileContents)
}
