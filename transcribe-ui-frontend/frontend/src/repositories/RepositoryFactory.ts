import VocabulariesRepository from './VocabulariesRepository'
import TranscribeRepository from './TranscribeRepository'

type Repositories = {
  [key: string]: any
}

const repositories: Repositories = {
  vocabularies: VocabulariesRepository,
  transcribe: TranscribeRepository
}

export default {
  get: (name: string): any => repositories[name]
}
