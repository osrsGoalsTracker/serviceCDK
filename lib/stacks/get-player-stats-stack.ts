import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class GetPlayerStatsStack extends cdk.Stack {
    public readonly getPlayerStatsFunction: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.getPlayerStatsFunction = new lambda.Function(this, 'GetPlayerStatsFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrs.goals.service.GetPlayerStatsHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getPlayerStats-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `GetPlayerStats-${stage}`
        });
    }
} 