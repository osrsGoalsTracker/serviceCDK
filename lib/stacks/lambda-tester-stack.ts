import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface LambdaTesterStackProps extends cdk.StackProps {
    lambdaFunctions: lambda.Function[];
}

export class LambdaTesterStack extends cdk.Stack {
    public readonly lambdaTesterFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: LambdaTesterStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.lambdaTesterFunction = new lambda.Function(this, 'LambdaTesterFunction', {
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'lambda_tester.handler',
            code: lambda.Code.fromAsset('lambda_tester'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                STAGE: stage
            },
            functionName: `LambdaTester-${stage}`
        });

        // Create IAM policy to allow invoking other Lambda functions
        const invokeLambdaPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['lambda:InvokeFunction'],
            resources: props.lambdaFunctions.map(fn => fn.functionArn)
        });

        // Add the policy to the Lambda role
        this.lambdaTesterFunction.addToRolePolicy(invokeLambdaPolicy);
    }
} 