import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';

interface GetCharactersForUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: GoalTrackerTableStack;
}

export class GetCharactersForUserStack extends cdk.Stack {
    public readonly getCharactersForUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: GetCharactersForUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.getCharactersForUserFunction = new lambda.Function(this, 'GetCharactersForUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.character.handler.GetCharactersForUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getCharactersForUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TRACKER_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
            },
            functionName: `GetCharactersForUser-${stage}`
        });

        // Grant DynamoDB permissions (read-only)
        props.goalTrackerTableStack.goalTrackerTable.grantReadData(this.getCharactersForUserFunction);
    }
} 