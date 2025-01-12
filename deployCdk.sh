#!/bin/bash

# Check if a stack name was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <stack-name>"
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

# Validate required environment variables
if [ -z "$AWS_ACCOUNT" ]; then
    echo "Error: AWS_ACCOUNT not set in .env"
    exit 1
fi

if [ -z "$STAGE" ]; then
    echo "Error: STAGE not set in .env"
    exit 1
fi

if [ -z "$USE_SSO" ]; then
    echo "Error: USE_SSO not set in .env"
    exit 1
fi

# Determine which profile to use
if [ "$USE_SSO" = true ]; then
    if [ -z "$SSO_PROFILE" ]; then
        echo "Error: SSO_PROFILE not set in .env"
        exit 1
    fi
    PROFILE_TO_USE=$SSO_PROFILE
    
    # Check if AWS SSO session is active
    if ! aws sts get-caller-identity --profile "$SSO_PROFILE" &>/dev/null; then
        echo "No active AWS SSO session found. Running aws sso login..."
        aws sso login --profile "$SSO_PROFILE"
    fi
else
    if [ -z "$LOCAL_PROFILE" ]; then
        echo "Error: LOCAL_PROFILE not set in .env"
        exit 1
    fi
    PROFILE_TO_USE=$LOCAL_PROFILE
fi

# Deploy the stack
echo "Deploying stack $1 to account $AWS_ACCOUNT in stage $STAGE using profile $PROFILE_TO_USE"
cdk deploy "$1" --context stage="$STAGE" --context account="$AWS_ACCOUNT" --profile "$PROFILE_TO_USE" 