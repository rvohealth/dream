import generateDream from '../helpers/cli/generateDream'

async function _generateDream() {
  let name = process.argv[2]
  console.log(process.argv)
  // await generateDream(
  //   name,
  //   attributes.filter(attr => !['--core'].includes(attr))
  // )
}
_generateDream()
