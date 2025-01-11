import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';

interface GetNotificationChannelsForUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: GoalTrackerTableStack;
}

export class GetNotificationChannelsForUserStack extends cdk.Stack {
    public readonly getNotificationChannelsForUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: GetNotificationChannelsForUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.getNotificationChannelsForUserFunction = new lambda.Function(this, 'GetNotificationChannelsForUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.notificationChannel.handler.GetNotificationChannelsForUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getNotificationChannelsForUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
            },
            functionName: `GetNotificationChannelsForUser-${stage}`
        });

        // Grant DynamoDB permissions (read-only)
        props.goalTrackerTableStack.goalTrackerTable.grantReadData(this.getNotificationChannelsForUserFunction);
    }
} 