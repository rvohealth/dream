import installCoreDreamDependenciesToDir from './installCoreDreamDependenciesToDir'

export default async function initDreamApp(args: string[]) {
  await installCoreDreamDependenciesToDir('dream app', '.', args)
}
