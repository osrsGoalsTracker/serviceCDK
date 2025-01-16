import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import config from '../config';

interface CreateUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: {
        goalTrackerTable: dynamodb.Table;
    };
}

export class CreateUserStack extends cdk.Stack {
    public readonly createUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: CreateUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';
        const stackConfig = config.stacks.createUser;

        if (!stackConfig.lambda) {
            throw new Error('Lambda configuration missing for CreateUser stack');
        }

        // Create Lambda function
        this.createUserFunction = new lambda.Function(this, 'CreateUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: stackConfig.lambda.handler,
            code: lambda.Code.fromAsset(stackConfig.lambda.jarPath),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `${stackConfig.lambda.name}-${stage}`,
            environment: {
                TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName,
                STAGE: stage
            }
        });

        // Grant DynamoDB permissions
        props.goalTrackerTableStack.goalTrackerTable.grantWriteData(this.createUserFunction);
    }
}
