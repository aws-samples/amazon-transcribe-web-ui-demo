import * as cdk from '@aws-cdk/core'
import * as dynamodb from '@aws-cdk/aws-dynamodb'

export class Database extends cdk.Construct {
  public readonly vocabTable: dynamodb.Table
  public readonly jobTable: dynamodb.Table

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    this.vocabTable = new dynamodb.Table(this, `${id}-vocab-table`, {
      tableName: 'Transcribe-CustomVocabulary',
      partitionKey: {
        name: 'display',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'phrase',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    })

    this.jobTable = new dynamodb.Table(this, `${id}-job-table`, {
      tableName: 'Transcribe-Job',
      partitionKey: {
        name: 'job',
        type: dynamodb.AttributeType.STRING
      },
      timeToLiveAttribute: 'expire',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    })
  }
}
