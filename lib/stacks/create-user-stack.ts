import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { GoalTableStack } from './goal-table-stack';

interface CreateUserStackProps extends cdk.StackProps {
    goalTableStack: GoalTableStack;
}

export class CreateUserStack extends cdk.Stack {
    public readonly createUserFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: CreateUserStackProps) {
        super(scope, id, props);

        // Create Lambda function
        this.createUserFunction = new lambda.Function(this, 'CreateUserFunction', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'com.osrs.goals.service.CreateUserHandler::handleRequest',
            code: lambda.Code.fromAsset('../service/build/libs/createUser-lambda-1.0-SNAPSHOT.jar'),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                GOAL_TABLE_NAME: props.goalTableStack.goalTable.tableName
            },
            functionName: `CreateUser-${props.stackName}`
        });

        // Grant DynamoDB permissions
        props.goalTableStack.goalTable.grantReadWriteData(this.createUserFunction);
    }
} 