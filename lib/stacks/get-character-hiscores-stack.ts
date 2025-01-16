import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import config from '../config';

export class GetCharacterHiscoresStack extends cdk.Stack {
    public readonly getCharacterHiscoresFunction: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';
        const stackConfig = config.stacks.getCharacterHiscores;

        if (!stackConfig.lambda) {
            throw new Error('Lambda configuration missing for GetCharacterHiscores stack');
        }

        // Create Lambda function
        this.getCharacterHiscoresFunction = new lambda.Function(this, 'GetCharacterHiscoresFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: stackConfig.lambda.handler,
            code: lambda.Code.fromAsset(stackConfig.lambda.jarPath),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `${stackConfig.lambda.name}-${stage}`
        });
    }
} 