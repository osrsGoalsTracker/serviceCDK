import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ParameterDefinition {
    name: string;  // The name to use in the Lambda request
    type: apigateway.JsonSchemaType;
    required: boolean;
    source: 'path' | 'body';
    template: string;  // VTL template for extracting the value
}

interface LambdaRouteConfig {
    httpMethod: string;
    resourcePath: string[];  // e.g., ['players', '{name}', 'stats']
    lambda: lambda.Function;
    operationName: string;
}

interface ApiGatewayStackProps extends cdk.StackProps {
    routes: LambdaRouteConfig[];
    parameterDefinitions: Record<string, ParameterDefinition>;  // Key is the route segment (e.g., '{userId}', 'users', etc.)
}

export class ApiGatewayStack extends cdk.Stack {
    public readonly api: apigateway.RestApi;
    private readonly parameterDefinitions: Record<string, ParameterDefinition>;

    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id, props);

        this.parameterDefinitions = props.parameterDefinitions;

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
        // Build the resource path and collect path parameters
        let resource = this.api.root;
        const pathParameters = new Set<string>();

        config.resourcePath.forEach(pathPart => {
            if (pathPart.startsWith('{') && pathPart.endsWith('}')) {
                pathParameters.add(pathPart.slice(1, -1));
            }
            const existingResource = resource.getResource(pathPart);
            resource = existingResource || resource.addResource(pathPart);
        });

        // Add method with Lambda proxy integration
        resource.addMethod(config.httpMethod, new apigateway.LambdaIntegration(config.lambda, {
            proxy: true,
            allowTestInvoke: true
        }), {
            operationName: config.operationName,
            methodResponses: [
                {
                    statusCode: '200'
                }
            ],
            requestParameters: Object.fromEntries(
                Array.from(pathParameters).map(param => [
                    `method.request.path.${param}`,
                    true
                ])
            )
        });
    }

    private collectRouteParameters(resourcePath: string[]): ParameterDefinition[] {
        const parameters: ParameterDefinition[] = [];

        resourcePath.forEach(segment => {
            const paramDef = this.parameterDefinitions[segment];
            if (paramDef) {
                parameters.push(paramDef);
            }
        });

        return parameters;
    }

    private createRequestTemplate(parameters: ParameterDefinition[]): string {
        const pathParameters = parameters.filter(param => param.source === 'path');
        const bodyParameters = parameters.filter(param => param.source === 'body');

        if (bodyParameters.length > 0) {
            // For POST requests with body, use the raw body
            return '$input.json(\'$\')';
        } else if (pathParameters.length > 0) {
            // For requests with path parameters
            const pathTemplate = {
                pathParameters: Object.fromEntries(
                    pathParameters.map(param => [
                        param.name,
                        `$input.params('${param.name}')`
                    ])
                )
            };
            return JSON.stringify(pathTemplate);
        }

        // Default empty template
        return '{}';
    }

    private createMethodRequestParameters(parameters: ParameterDefinition[]): Record<string, boolean> {
        const params: Record<string, boolean> = {};
        parameters
            .filter(param => param.source === 'path')
            .forEach(param => {
                params[`method.request.path.${param.name}`] = param.required;
            });
        return params;
    }

    private createIntegrationRequestParameters(parameters: ParameterDefinition[]): Record<string, string> {
        const params: Record<string, string> = {};
        parameters
            .filter(param => param.source === 'path')
            .forEach(param => {
                params[`integration.request.path.${param.name}`] = `method.request.path.${param.name}`;
            });
        return params;
    }

    private createRequestModel(
        config: LambdaRouteConfig,
        parameters: ParameterDefinition[]
    ): Record<string, apigateway.Model> | undefined {
        const bodyParameters = parameters.filter(param => param.source === 'body');
        if (bodyParameters.length === 0) return undefined;

        return {
            'application/json': new apigateway.Model(this, `${config.operationName}RequestModel`, {
                restApi: this.api,
                contentType: 'application/json',
                modelName: `${config.operationName}Request`,
                schema: {
                    type: apigateway.JsonSchemaType.OBJECT,
                    properties: Object.fromEntries(
                        bodyParameters.map(param => [
                            param.name,
                            { type: param.type }
                        ])
                    ),
                    required: bodyParameters
                        .filter(param => param.required)
                        .map(param => param.name)
                }
            })
        };
    }
} 