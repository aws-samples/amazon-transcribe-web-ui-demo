import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'

export class Storage extends cdk.Construct {
  public readonly bucket: s3.Bucket

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    const allowedOrigin: string = scope.node.tryGetContext('allowedOrigin')

    const corsRule: [s3.CorsRule] = [
      {
        allowedOrigins: [allowedOrigin],
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedHeaders: ['*'],
        exposedHeaders: ['ETag']
      }
    ]

    this.bucket = new s3.Bucket(this, `${id}-trans-bucket`, {
      versioned: false,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: corsRule,
      lifecycleRules: [{ expiration: cdk.Duration.days(1) }]
    })

    new cdk.CfnOutput(this, `${id}-bucket-name`, {
      value: this.bucket.bucketName
    })
  }
}
