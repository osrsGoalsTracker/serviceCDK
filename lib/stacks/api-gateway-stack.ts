import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface LambdaRouteConfig {
    httpMethod: string;
    resourcePath: string[];  // e.g., ['players', '{rsn}', 'stats']
    lambda: lambda.Function;
    operationName: string;
}

interface ApiGatewayStackProps extends cdk.StackProps {
    routes: LambdaRouteConfig[];
}

export class ApiGatewayStack extends cdk.Stack {
    public readonly api: apigateway.RestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
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

        // Add all routes
        props.routes.forEach(route => this.addRoute(route));

        // Output the API URL
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: 'ApiGatewayUrl'
        });
    }

    private addRoute(config: LambdaRouteConfig) {
        // Build the resource path
        let resource = this.api.root;
        config.resourcePath.forEach(pathPart => {
            const existingResource = resource.getResource(pathPart);
            resource = existingResource || resource.addResource(pathPart);
        });

        // Add method with Lambda integration
        resource.addMethod(config.httpMethod, new apigateway.LambdaIntegration(config.lambda, {
            proxy: false,
            allowTestInvoke: true,
            integrationResponses: [
                {
                    statusCode: '200'
                }
            ]
        }), {
            operationName: config.operationName,
            methodResponses: [
                {
                    statusCode: '200'
                }
            ],
            requestModels: config.httpMethod === 'POST' ? {
                'application/json': new apigateway.Model(this, `${config.operationName}RequestModel`, {
                    restApi: this.api,
                    contentType: 'application/json',
                    modelName: `${config.operationName}Request`,
                    schema: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        properties: {
                            email: { type: apigateway.JsonSchemaType.STRING }
                        },
                        required: ['email']
                    }
                })
            } : undefined
        });
    }
} 