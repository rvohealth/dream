import DreamApp from '../../dream-app/index.js'

export default function addImportSuffix(filepath: string) {
  return `${filepath.replace(/(\.ts|\.js)$/, '')}${suffix()}`
}

function suffix() {
  switch (DreamApp.getOrFail().importExtension) {
    case '.js':
      return '.js'
    case '.ts':
      return '.ts'
    case 'none':
      return ''
  }
}
