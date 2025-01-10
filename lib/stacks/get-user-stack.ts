import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';

interface GetUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: GoalTrackerTableStack;
}

export class GetUserStack extends cdk.Stack {
    public readonly getUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: GetUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.user.handler.GetUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
            },
            functionName: `GetUser-${stage}`
        });

        // Grant DynamoDB permissions
        props.goalTrackerTableStack.goalTrackerTable.grantReadData(this.getUserFunction);
    }
} 