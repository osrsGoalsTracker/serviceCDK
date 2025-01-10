#!/bin/bash

# Check if a function name was provided
if [ $# -ne 1 ]; then
    echo "Usage: ./updateDevLambda.sh <FunctionName>"
    echo "Example: ./updateDevLambda.sh CreateUser"
    echo "Available functions: CreateUser, GetUser, GetCharacterHiscores, AddCharacterToUser, GetCharactersForUser"
    exit 1
fi

FUNCTION_NAME="$1"
STAGE="dev"

# Get the jar name based on the function name
get_jar_name() {
    case "$1" in
        "CreateUser") echo "createUser" ;;
        "GetUser") echo "getUser" ;;
        "GetCharacterHiscores") echo "getCharacterHiscores" ;;
        "AddCharacterToUser") echo "addCharacterToUser" ;;
        "GetCharactersForUser") echo "getCharactersForUser" ;;
        *) echo "" ;;
    esac
}

# Check if the function name is valid
JAR_NAME=$(get_jar_name "$FUNCTION_NAME")
if [ -z "$JAR_NAME" ]; then
    echo "Error: Invalid function name '${FUNCTION_NAME}'"
    echo "Available functions: CreateUser, GetUser, GetCharacterHiscores, AddCharacterToUser, GetCharactersForUser"
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
    --zip-file "fileb://${JAR_PATH}" \
    --profile dev

if [ $? -eq 0 ]; then
    echo "Successfully updated ${FULL_FUNCTION_NAME}"
else
    echo "Failed to update ${FULL_FUNCTION_NAME}"
    exit 1
fi 