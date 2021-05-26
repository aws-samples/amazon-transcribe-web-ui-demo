import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as iam from '@aws-cdk/aws-iam'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as s3 from '@aws-cdk/aws-s3'
import * as eventsTargets from '@aws-cdk/aws-events-targets'

import { LambdaFunction } from '../construct/lambda-function'

interface BatchProps {
  vocabTable: dynamodb.Table
  transBucket: s3.Bucket
}

export class Batch extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: BatchProps) {
    super(scope, id)

    const updateVocabFunc = new LambdaFunction(this, `${id}-update-vocab`, {
      entry: './lambda/batch.ts',
      environment: {
        VOCABULARY_TABLE: props.vocabTable.tableName,
        TRANSCRIBE_BUCKET: props.transBucket.bucketName
      }
    })
    updateVocabFunc.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'transcribe:UpdateVocabulary',
          'transcribe:CreateVocabulary',
          'transcribe:GetVocabulary'
        ]
      })
    )
    props.vocabTable.grantReadWriteData(updateVocabFunc)
    props.transBucket.grantReadWrite(updateVocabFunc)

    const eventTarget = new eventsTargets.LambdaFunction(updateVocabFunc)

    const rule = new events.Rule(this, `${id}-lambda-event-rule`, {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '17',
        day: '*',
        month: '*',
        year: '*'
      }),
      targets: [eventTarget]
    })
  }
}
