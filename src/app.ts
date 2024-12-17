import * as cdk from 'aws-cdk-lib';
import { PlayerStack } from './stacks/player-stack';
import { getStageConfig } from './config';

const app = new cdk.App();

// Get stage from context or default to 'alpha'
const stage = app.node.tryGetContext('stage') || 'alpha';
const stageConfig = getStageConfig(stage);

new PlayerStack(app, `PlayerStack-${stage}`, stageConfig, {
    env: {
        account: stageConfig.accountId,
        region: stageConfig.region
    },
    description: `Player service stack for ${stage} stage`
});

app.synth(); 