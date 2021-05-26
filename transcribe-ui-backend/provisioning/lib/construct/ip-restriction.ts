import * as cdk from '@aws-cdk/core'
import * as waf from '@aws-cdk/aws-wafv2'
import * as apigateway from '@aws-cdk/aws-apigateway'

export class IpRestriction extends cdk.Construct {
  public readonly webAcl: waf.CfnWebACL

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id)

    const ipRange: string[] = scope.node.tryGetContext('allowIpRange')

    const ipSets = new waf.CfnIPSet(this, `${id}-ip-sets`, {
      name: 'Transcribe-WAF-IPsets',
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      addresses: ipRange
    })

    this.webAcl = new waf.CfnWebACL(this, `${id}-waf`, {
      defaultAction: { block: {} },
      name: 'Transcribe-WAF-WebACL',
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: 'Transcribe-WAF-WebACL'
      },
      rules: [
        {
          name: 'IP-Restriction',
          priority: 0,
          action: { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: 'Transcribe-WAF-IP-Restriction'
          },
          statement: {
            ipSetReferenceStatement: {
              arn: ipSets.attrArn
            }
          }
        }
      ]
    })
  }

  applyApi(api: apigateway.RestApi) {
    const region = cdk.Stack.of(this).region
    const restApiId = api.restApiId
    const stageName = api.deploymentStage.stageName
    const stageArn = `arn:aws:apigateway:${region}::/restapis/${restApiId}/stages/${stageName}`

    new waf.CfnWebACLAssociation(this, 'apply-webacl-apigw', {
      webAclArn: this.webAcl.attrArn,
      resourceArn: stageArn
    })
  }
}
