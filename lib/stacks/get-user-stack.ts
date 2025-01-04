import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalsTableStack } from './goals-table-stack';

interface GetUserStackProps extends cdk.StackProps {
    goalsTableStack: GoalsTableStack;
}

export class GetUserStack extends cdk.Stack {
    public readonly getUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: GetUserStackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create Lambda function
        this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrs.goals.service.GetUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/getUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOALS_TABLE_NAME: props.goalsTableStack.goalTable.tableName
            },
            functionName: `GetUser-${stage}`
        });

        // Grant DynamoDB permissions
        props.goalsTableStack.goalTable.grantReadData(this.getUserFunction);
    }
} 