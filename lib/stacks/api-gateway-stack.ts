import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
    public readonly api: apigateway.RestApi;
    public readonly playersResource: apigateway.Resource;
    public readonly playerResource: apigateway.Resource;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create API Gateway
        this.api = new apigateway.RestApi(this, 'OsrsGoalsApi', {
            restApiName: 'osrs-goals-api',
            description: 'API Gateway for OSRS Goals service',
            deployOptions: {
                stageName: 'v1',
                tracingEnabled: true,
                dataTraceEnabled: true,
                metricsEnabled: true
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS
            }
        });

        // Create /players resource
        this.playersResource = this.api.root.addResource('players');
        
        // Add {rsn} path parameter
        this.playerResource = this.playersResource.addResource('{rsn}');

        // Output the API URL
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: 'ApiGatewayUrl'
        });
    }
} 