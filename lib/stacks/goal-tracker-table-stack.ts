import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class GoalTrackerTableStack extends cdk.Stack {
    public readonly goalTrackerTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const stage = this.node.tryGetContext('stage') || 'dev';

        // Create the GoalTracker DynamoDB table
        this.goalTrackerTable = new dynamodb.Table(this, 'GoalTrackerTable', {
            tableName: `GoalTracker-${stage}`,
            partitionKey: {
                name: 'pk',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'sk',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN for production
            pointInTimeRecovery: true,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // Add GSI for email-based lookups
        this.goalTrackerTable.addGlobalSecondaryIndex({
            indexName: 'email-sk-index',
            partitionKey: {
                name: 'email',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'sk',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL
        });
    }
} 