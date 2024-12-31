import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ApiGatewayStack } from './api-gateway-stack';

interface GetPlayerStatsStackProps extends cdk.StackProps {
    apiGatewayStack: ApiGatewayStack;
}

export class GetPlayerStatsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: GetPlayerStatsStackProps) {
        super(scope, id, props);

        // Create Lambda function
        const getPlayerStatsFunction = new lambda.Function(this, 'GetPlayerStatsFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrs.goals.service.GetPlayerStatsHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getPlayerStats-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30)
        });

        // Add stats endpoint under the {rsn} resource
        const statsResource = props.apiGatewayStack.playerResource.addResource('stats');
        statsResource.addMethod('GET', new apigateway.LambdaIntegration(getPlayerStatsFunction, {
            proxy: true,
            allowTestInvoke: true
        }), {
            operationName: 'GetPlayerStats',
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL
                    }
                }
            ]
        });
    }
} 