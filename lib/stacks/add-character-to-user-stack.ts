import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';

interface AddCharacterToUserStackProps extends cdk.StackProps {
    goalTrackerTableStack: GoalTrackerTableStack;
}

export class AddCharacterToUserStack extends cdk.Stack {
    public readonly addCharacterToUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: AddCharacterToUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.addCharacterToUserFunction = new lambda.Function(this, 'AddCharacterToUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrsGoalTracker.character.handler.AddCharacterToUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/addCharacterToUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                CHARACTER_TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
            },
            functionName: `AddCharacterToUser-${stage}`
        });

        // Grant DynamoDB permissions
        props.goalTrackerTableStack.goalTrackerTable.grantReadWriteData(this.addCharacterToUserFunction);
    }
} 