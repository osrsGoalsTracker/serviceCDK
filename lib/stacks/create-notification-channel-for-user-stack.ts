import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';

interface CreateNotificationChannelForUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: GoalTrackerTableStack;
}

export class CreateNotificationChannelForUserStack extends cdk.Stack {
    public readonly createNotificationChannelForUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: CreateNotificationChannelForUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.createNotificationChannelForUserFunction = new lambda.Function(this, 'CreateNotificationChannelForUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.notificationChannel.handler.CreateNotificationChannelForUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/createNotificationChannelForUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
            },
            functionName: `CreateNotificationChannelForUser-${stage}`
        });

        // Grant DynamoDB permissions (write access)
        props.goalTrackerTableStack.goalTrackerTable.grantWriteData(this.createNotificationChannelForUserFunction);
    }
} 