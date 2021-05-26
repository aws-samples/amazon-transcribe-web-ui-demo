import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as secretsmanager from '@aws-cdk/aws-secretsmanager'
import * as apigateway from '@aws-cdk/aws-apigateway'
import * as logs from '@aws-cdk/aws-logs'

import { LambdaFunction } from './lambda-function'
import { IpRestriction } from './ip-restriction'

interface ApiProps {
  vocabTable: dynamodb.Table
  jobTable: dynamodb.Table
  transBucket: s3.Bucket
}

export class Api extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ApiProps) {
    super(scope, id)

    const logGroup = new logs.LogGroup(this, `${id}-api-log`, {
      retention: logs.RetentionDays.INFINITE
    })

    const api = new apigateway.RestApi(this, `${id}-rest-api`, {
      restApiName: 'Transcribe-API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      },
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup)
      }
    })

    // WAF IP Restriction
    const ipRestriction = new IpRestriction(this, `${id}-ip-restriction`)
    ipRestriction.applyApi(api)

    // POST  /transcribe
    const transFunc = new LambdaFunction(this, `${id}-trans-func`, {
      entry: './lambda/transcribe.ts',
      environment: {
        JOB_TABLE: props.jobTable.tableName,
        TRANSCRIBE_BUCKET: props.transBucket.bucketName
      }
    })
    transFunc.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'transcribe:StartTranscriptionJob',
          'transcribe:GetVocabulary'
        ]
      })
    )
    props.jobTable.grantReadWriteData(transFunc)
    props.transBucket.grantReadWrite(transFunc)

    const transIntegration = new apigateway.LambdaIntegration(transFunc)
    api.root.addResource('transcribe').addMethod('POST', transIntegration)

    // GET  /sign
    const secretName = 'Transcribe-Secret'
    const secret = new secretsmanager.Secret(this, `${id}-secret-manager`, {
      secretName
    })

    const signFunc = new LambdaFunction(this, `${id}-sign-func`, {
      entry: './lambda/sign.ts',
      environment: {
        TRANSCRIBE_BUCKET: props.transBucket.bucketName,
        SECRET_NAME: secretName
      }
    })
    signFunc.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [secret.secretArn],
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret'
        ]
      })
    )
    props.transBucket.grantReadWrite(signFunc)

    const signIntegration = new apigateway.LambdaIntegration(signFunc)
    api.root.addResource('sign').addMethod('GET', signIntegration)

    // ANY  /vocabularies
    const vocabFunc = new LambdaFunction(this, `${id}-vocab-func`, {
      entry: './lambda/vocabularies.ts',
      environment: {
        VOCABULARY_TABLE: props.vocabTable.tableName
      }
    })
    props.vocabTable.grantReadWriteData(vocabFunc)

    const vocabIntegration = new apigateway.LambdaIntegration(vocabFunc)
    const vocab = api.root.addResource('vocabularies')
    vocab.addMethod('GET', vocabIntegration)
    vocab.addMethod('POST', vocabIntegration)
    vocab.addMethod('DELETE', vocabIntegration)
  }
}
