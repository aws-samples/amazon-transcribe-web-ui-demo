import * as cdk from '@aws-cdk/core'
import { Database } from '../construct/database'
import { Storage } from '../construct/storage'
import { Api } from '../construct/api'
import { Batch } from '../construct/batch'
import { Event } from '../construct/events'

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const db = new Database(this, 'Transcribe-Database')
    const storage = new Storage(this, 'Transcribe-Storage')

    const api = new Api(this, 'Transcribe-APIs', {
      vocabTable: db.vocabTable,
      jobTable: db.jobTable,
      transBucket: storage.bucket
    })

    const batch = new Batch(this, 'Transcribe-Batch', {
      vocabTable: db.vocabTable,
      transBucket: storage.bucket
    })

    const events = new Event(this, 'Transcribe-Event', {
      jobTable: db.jobTable,
      transBucket: storage.bucket
    })
  }
}
