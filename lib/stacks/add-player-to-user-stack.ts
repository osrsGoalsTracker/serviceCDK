import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';

interface AddPlayerToUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: GoalTrackerTableStack;
}

export class AddPlayerToUserStack extends cdk.Stack {
    public readonly addPlayerToUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: AddPlayerToUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.addPlayerToUserFunction = new lambda.Function(this, 'AddPlayerToUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.service.AddPlayerToUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/addPlayerToUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
            },
            functionName: `AddPlayerToUser-${stage}`
        });

        // Grant DynamoDB permissions
        props.goalTrackerTableStack.goalTrackerTable.grantReadWriteData(this.addPlayerToUserFunction);
    }
} 