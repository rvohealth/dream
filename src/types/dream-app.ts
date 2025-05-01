import DreamApp from '../dream-app/index.js'

export type DreamApplicationLoadable = 'models' | 'serializers' | 'initializers'

export type DreamAppInitializerCb = (dreamApp: DreamApp) => void | Promise<void>
