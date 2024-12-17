export interface StageConfig {
    stage: string;
    accountId: string;
    region: string;
}

export interface Config {
    [stage: string]: Omit<StageConfig, 'stage'>;
}

export const config: Config = {
    prod: {
        accountId: '123',
        region: 'us-west-2'
    },
    beta: {
        accountId: '123', // TODO: Replace with actual beta account ID
        region: 'us-west-2'
    },
    developer: {
        accountId: '123', // Default developer account ID - override with your own
        region: 'us-west-2'
    }
};

export const getStageConfig = (stage: string): StageConfig => {
    const stageConfig = config[stage];
    if (!stageConfig) {
        throw new Error(`No configuration found for stage: ${stage}`);
    }
    return {
        stage,
        accountId: stageConfig.accountId,
        region: stageConfig.region
    };
}; 