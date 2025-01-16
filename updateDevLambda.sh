#!/bin/bash

# Function to read value from JSON config using jq
get_config_value() {
    local key=$1
    jq -r "$key" config.json
}

# Function to list all lambda functions
list_lambda_functions() {
    echo "Available functions:"
    for stack in $(jq -r '.stacks | keys[]' config.json); do
        lambda_name=$(jq -r ".stacks[\"$stack\"].lambda.name" config.json)
        if [ "$lambda_name" != "null" ]; then
            echo " - $lambda_name"
        fi
    done
    echo " - LambdaTester"
}

# Function to get jar path for a lambda
get_jar_path() {
    local lambda_name=$1
    jq -r ".stacks | to_entries[] | select(.value.lambda.name == \"$lambda_name\") | .value.lambda.jarPath" config.json
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    echo "Please install jq first:"
    echo "  - Mac: brew install jq"
    echo "  - Linux: sudo apt-get install jq"
    exit 1
fi

# Check if a function name was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <function-name>"
    list_lambda_functions
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Load environment variables from .env
set -a
source .env
set +a

FUNCTION_NAME=$1

# Validate function name exists in config
if [ "$FUNCTION_NAME" != "LambdaTester" ] && [ -z "$(get_jar_path "$FUNCTION_NAME")" ]; then
    echo "Invalid function name: $FUNCTION_NAME"
    list_lambda_functions
    exit 1
fi

# Configure AWS credentials
if [ "$USE_SSO" = true ]; then
    echo "Using AWS SSO profile: $SSO_PROFILE"
    export AWS_PROFILE=$SSO_PROFILE
    
    # Check if AWS SSO session is active
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "No active AWS SSO session found. Running aws sso login..."
        aws sso login --profile $SSO_PROFILE
    fi
else
    echo "Using local AWS profile: $LOCAL_PROFILE"
    export AWS_PROFILE=$LOCAL_PROFILE
fi

# Handle Python Lambda (LambdaTester) differently
if [ "$FUNCTION_NAME" = "LambdaTester" ]; then
    echo "Deploying Python Lambda: $FUNCTION_NAME"
    
    # Install dependencies
    cd lambda_tester
    echo "Installing Python dependencies..."
    python3 -m pip install -r requirements.txt -t . --quiet
    
    # Create deployment package
    echo "Creating deployment package..."
    zip -r ../lambda_tester.zip . -q
    cd ..
    
    # Construct the full function name
    FULL_FUNCTION_NAME="${FUNCTION_NAME}-${STAGE}"
    
    echo "Updating Lambda function ${FULL_FUNCTION_NAME}"
    aws lambda update-function-code \
        --function-name "${FULL_FUNCTION_NAME}" \
        --zip-file "fileb://lambda_tester.zip"
    
    # Clean up
    rm lambda_tester.zip
    
    if [ $? -eq 0 ]; then
        echo "Successfully updated ${FULL_FUNCTION_NAME}"
    else
        echo "Failed to update ${FULL_FUNCTION_NAME}"
        exit 1
    fi
else
    # Handle Java Lambdas
    JAR_PATH=$(get_jar_path "$FUNCTION_NAME")
    if [ -z "$JAR_PATH" ]; then
        echo "Error: Could not find jar path for function '${FUNCTION_NAME}'"
        exit 1
    fi

    # Construct the full function name
    FULL_FUNCTION_NAME="${FUNCTION_NAME}-${STAGE}"

    # Check if the jar file exists
    if [ ! -f "$JAR_PATH" ]; then
        echo "Error: Jar file not found at ${JAR_PATH}"
        echo "Make sure you've built the project first"
        exit 1
    fi

    echo "Updating Lambda function ${FULL_FUNCTION_NAME} with jar ${JAR_PATH}"
    aws lambda update-function-code \
        --function-name "${FULL_FUNCTION_NAME}" \
        --zip-file "fileb://${JAR_PATH}"

    if [ $? -eq 0 ]; then
        echo "Successfully updated ${FULL_FUNCTION_NAME}"
    else
        echo "Failed to update ${FULL_FUNCTION_NAME}"
        exit 1
    fi
fi 