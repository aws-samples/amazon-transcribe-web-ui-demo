import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as waf from '@aws-cdk/aws-waf'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'

interface FrontendServiceProps extends cdk.StackProps {
  webAcl: waf.CfnWebACL
}

export class FrontendService extends cdk.Construct {
  public readonly distribution: cloudfront.CloudFrontWebDistribution
  public readonly bucket: s3.Bucket

  constructor(scope: cdk.Construct, id: string, props?: FrontendServiceProps) {
    super(scope, id)

    this.bucket = new s3.Bucket(this, `${id}-bucket`, {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html'
    })

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      `${id}-oai`
    )

    const bucketPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: iam.Effect.ALLOW,
      principals: [originAccessIdentity.grantPrincipal],
      resources: [`${this.bucket.bucketArn}/*`]
    })
    this.bucket.addToResourcePolicy(bucketPolicy)

    this.distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      `${id}-distribution`,
      {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        webACLId: props?.webAcl.ref,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.bucket,
              originAccessIdentity: originAccessIdentity
            },
            behaviors: [
              {
                isDefaultBehavior: true
              }
            ]
          }
        ],
        errorConfigurations: [
          {
            errorCachingMinTtl: 300,
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html'
          }
        ]
      }
    )

    new cdk.CfnOutput(this, 'frontend-endpoint', {
      value: `https://${this.distribution.distributionDomainName}`
    })
  }
}
