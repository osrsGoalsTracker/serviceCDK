import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import config from '../config';

interface CreateNotificationChannelForUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: {
        goalTrackerTable: dynamodb.Table;
    };
}

export class CreateNotificationChannelForUserStack extends cdk.Stack {
    public readonly createNotificationChannelForUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: CreateNotificationChannelForUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';
        const stackConfig = config.stacks.createNotificationChannelForUser;

        if (!stackConfig.lambda) {
            throw new Error('Lambda configuration missing for CreateNotificationChannelForUser stack');
        }

        // Create Lambda function
        this.createNotificationChannelForUserFunction = new lambda.Function(this, 'CreateNotificationChannelForUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: stackConfig.lambda.handler,
            code: lambda.Code.fromAsset(stackConfig.lambda.jarPath),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            functionName: `${stackConfig.lambda.name}-${stage}`,
            environment: {
                NOTIFICATION_CHANNEL_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName,
                STAGE: stage
            }
        });

        // Grant DynamoDB permissions
        props.goalTrackerTableStack.goalTrackerTable.grantWriteData(this.createNotificationChannelForUserFunction);
    }
} 