import * as cdk from '@aws-cdk/core'
import * as s3deploy from '@aws-cdk/aws-s3-deployment'
import * as wafv1 from '@aws-cdk/aws-waf'
import * as iam from '@aws-cdk/aws-iam'
import { FrontendService } from '../construct/frontend-service'

export class FrontendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id)

    const ipRange: string[] = scope.node.tryGetContext('allowIpRange')

    const ipSet = new wafv1.CfnIPSet(this, `${id}-ip-set`, {
      name: 'Frontend-WAF-IPsets',
      ipSetDescriptors: ipRange.map((ipAddress) => ({
        type: 'IPV4',
        value: ipAddress
      }))
    })

    const rule = new wafv1.CfnRule(this, `${id}-waf-rule`, {
      metricName: 'FrontendWAFIpRestriction',
      name: 'IP-Restriction',
      predicates: [
        {
          dataId: ipSet.ref,
          negated: false,
          type: 'IPMatch'
        }
      ]
    })

    const webAcl = new wafv1.CfnWebACL(this, `${id}-waf`, {
      defaultAction: {
        type: 'BLOCK'
      },
      metricName: 'FrontendWAFWebACL',
      name: 'Frontend-WAF-WebACL',
      rules: [
        {
          action: {
            type: 'ALLOW'
          },
          priority: 1,
          ruleId: rule.ref
        }
      ]
    })

    const frontend = new FrontendService(this, `${id}-frontend-service`, {
      webAcl
    })

    new s3deploy.BucketDeployment(this, `${id}-deployment`, {
      sources: [s3deploy.Source.asset('./frontend/build')],
      destinationBucket: frontend.bucket,
      distribution: frontend.distribution,
      distributionPaths: ['/*']
    })
  }
}
