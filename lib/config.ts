import * as fs from 'fs';
import * as path from 'path';

interface LambdaConfig {
    name: string;
    jarPath: string;
    handler: string;
}

interface StackConfig {
    name: string;
    lambda?: LambdaConfig;
}

interface Config {
    stacks: {
        [key: string]: StackConfig;
    };
}

// Load and parse the config file
const configPath = path.join(__dirname, '..', 'config.json');
const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export default config; 