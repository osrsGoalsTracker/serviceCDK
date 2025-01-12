#!/bin/bash

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

# Construct the full function name
FUNCTION_NAME="LambdaTester-${STAGE}"

echo "Invoking Lambda tester..."
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{}' \
    --cli-binary-format raw-in-base64-out \
    response.json

if [ $? -eq 0 ]; then
    echo -e "\nTest Results:"
    cat response.json | jq '.'
    rm response.json
    echo -e "\nLambda tester completed successfully"
else
    echo "Failed to invoke Lambda tester"
    exit 1
fi 