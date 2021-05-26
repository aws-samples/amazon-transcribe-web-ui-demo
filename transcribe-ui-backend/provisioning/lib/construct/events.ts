import * as cdk from '@aws-cdk/core'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as events from '@aws-cdk/aws-events'
import * as eventsTargets from '@aws-cdk/aws-events-targets'

import { LambdaFunction } from '../construct/lambda-function'

interface EventProps {
  jobTable: dynamodb.Table
  transBucket: s3.Bucket
}

export class Event extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: EventProps) {
    super(scope, id)

    const fromAddress: string = scope.node.tryGetContext('fromAddress')
    if (!(fromAddress || '').trim()) {
      throw new Error('fromAddress not found')
    }

    const sendmailFunc = new LambdaFunction(this, `${id}-sendmail`, {
      entry: './lambda/sendmail.ts',
      environment: {
        JOB_TABLE: props.jobTable.tableName,
        TRANSCRIBE_BUCKET: props.transBucket.bucketName,
        FROM_ADDRESS: fromAddress
      },
      modules: ['iconv-lite']
    })
    sendmailFunc.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'transcribe:GetTranscriptionJob',
          'transcribe:DeleteTranscriptionJob',
          'ses:SendEmail',
          'ses:SendRawEmail'
        ]
      })
    )
    props.jobTable.grantReadWriteData(sendmailFunc)
    props.transBucket.grantReadWrite(sendmailFunc)

    const rule = new events.Rule(this, `${id}-trans-event-rule`, {
      eventPattern: {
        source: ['aws.transcribe'],
        detailType: ['Transcribe Job State Change'],
        detail: {
          TranscriptionJobStatus: ['COMPLETED', 'FAILED']
        }
      }
    })

    rule.addTarget(new eventsTargets.LambdaFunction(sendmailFunc))
  }
}
