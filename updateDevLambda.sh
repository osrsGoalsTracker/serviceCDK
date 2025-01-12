#!/bin/bash

# Check if a function name was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <function-name>"
    echo "Available functions:"
    echo "  - CreateUser"
    echo "  - GetUser"
    echo "  - GetCharacterHiscores"
    echo "  - AddCharacterToUser"
    echo "  - GetCharactersForUser"
    echo "  - CreateNotificationChannelForUser"
    echo "  - GetNotificationChannelsForUser"
    echo "  - CreateGoalFromGoalCreationRequestEvent"
    echo "  - LambdaTester"
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

# Validate function name
case $FUNCTION_NAME in
    "CreateUser"|"GetUser"|"GetCharacterHiscores"|"AddCharacterToUser"|"GetCharactersForUser"|"CreateNotificationChannelForUser"|"GetNotificationChannelsForUser"|"CreateGoalFromGoalCreationRequestEvent"|"LambdaTester")
        ;;
    *)
        echo "Invalid function name: $FUNCTION_NAME"
        exit 1
        ;;
esac

# Get the jar name based on the function name
get_jar_name() {
    case "$1" in
        "CreateUser") echo "createUser" ;;
        "GetUser") echo "getUser" ;;
        "GetCharacterHiscores") echo "getCharacterHiscores" ;;
        "AddCharacterToUser") echo "addCharacterToUser" ;;
        "GetCharactersForUser") echo "getCharactersForUser" ;;
        "CreateNotificationChannelForUser") echo "createNotificationChannelForUser" ;;
        "GetNotificationChannelsForUser") echo "getNotificationChannelsForUser" ;;
        "CreateGoalFromGoalCreationRequestEvent") echo "CreateGoalFromGoalCreationRequestEvent" ;;
        *) echo "" ;;
    esac
}

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
    JAR_NAME=$(get_jar_name "$FUNCTION_NAME")
    if [ -z "$JAR_NAME" ]; then
        echo "Error: Invalid function name '${FUNCTION_NAME}'"
        exit 1
    fi

    # Construct the full function name
    FULL_FUNCTION_NAME="${FUNCTION_NAME}-${STAGE}"

    # Check if the jar file exists
    JAR_PATH="../service/build/libs/${JAR_NAME}-lambda-1.0-SNAPSHOT.jar"
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