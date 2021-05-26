import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as lambdaNodejs from '@aws-cdk/aws-lambda-nodejs'

interface LambdaFunctionProps extends lambdaNodejs.NodejsFunctionProps {
  entry: string
  modules?: string[]
}

export class LambdaFunction extends lambdaNodejs.NodejsFunction {
  constructor(scope: cdk.Construct, id: string, props: LambdaFunctionProps) {
    const defaultProps: lambdaNodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      timeout: cdk.Duration.minutes(15),
      bundling: {
        nodeModules: props.modules
      }
    }

    const functionProps: lambdaNodejs.NodejsFunctionProps = {
      ...defaultProps,
      ...props
    }

    super(scope, id, functionProps)
  }
}
