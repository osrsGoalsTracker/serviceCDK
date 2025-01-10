import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class GetCharacterHiscoresStack extends cdk.Stack {
    public readonly getCharacterHiscoresFunction: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.getCharacterHiscoresFunction = new lambda.Function(this, 'GetCharacterHiscoresFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.hiscore.handler.GetCharacterHiscoresHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getCharacterHiscores-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `GetCharacterHiscores-${stage}`
        });
    }
} 