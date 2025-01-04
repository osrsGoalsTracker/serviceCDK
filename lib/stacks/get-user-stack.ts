import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTableStack } from './goal-table-stack';

interface GetUserStackProps extends cdk.StackProps {
    goalTableStack: GoalTableStack;
}

export class GetUserStack extends cdk.Stack {
    public readonly getUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: GetUserStackProps) {
        super(scope, id, props);

        // Create Lambda function
        this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrs.goals.service.GetUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TABLE_NAME: props.goalTableStack.goalTable.tableName
            }
        });

        // Grant DynamoDB permissions
        props.goalTableStack.goalTable.grantReadData(this.getUserFunction);
    }
} 