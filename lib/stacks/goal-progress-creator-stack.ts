import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { GoalTrackerTableStack } from './goal-tracker-table-stack';
const config = require('../../config.json');

interface GoalProgressCreatorStackProps extends cdk.StackProps {
  goalTrackerTableStack: GoalTrackerTableStack;
}

export class GoalProgressCreatorStack extends cdk.Stack {
  public readonly handler: lambda.Function;

  constructor(scope: Construct, id: string, props: GoalProgressCreatorStackProps) {
    super(scope, id, props);

    const stage = process.env.STAGE || 'dev';

    this.handler = new lambda.Function(this, config.stacks.goalProgressCreator.lambda.name, {
      runtime: lambda.Runtime.JAVA_21,
      code: lambda.Code.fromAsset(config.stacks.goalProgressCreator.lambda.jarPath),
      handler: config.stacks.goalProgressCreator.lambda.handler,
      environment: {
        STAGE: stage,
        TABLE_NAME: props.goalTrackerTableStack.goalTrackerTable.tableName
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30)
    });

    // Grant write permissions to DynamoDB
    props.goalTrackerTableStack.goalTrackerTable.grantWriteData(this.handler);

    // Add CloudWatch Logs permissions
    this.handler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        resources: ['*']
      })
    );
  }
} 