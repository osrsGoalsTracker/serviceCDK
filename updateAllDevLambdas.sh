#!/bin/bash

# Array of all Lambda functions
FUNCTIONS=(
    "CreateUser"
    "GetUser"
    "GetCharacterHiscores"
    "AddCharacterToUser"
    "GetCharactersForUser"
    "CreateNotificationChannelForUser"
    "GetNotificationChannelsForUser"
    "CreateGoalFromGoalCreationRequestEvent"
    "GoalCreationRequestEventProducer"
)

# Track failures
FAILED_FUNCTIONS=()

# Update each function
for func in "${FUNCTIONS[@]}"; do
    echo "Updating $func..."
    if ! ./updateDevLambda.sh "$func"; then
        FAILED_FUNCTIONS+=("$func")
    fi
    echo "----------------------------------------"
done

# Print summary
echo "Update Summary:"
echo "Total functions: ${#FUNCTIONS[@]}"
echo "Failed functions: ${#FAILED_FUNCTIONS[@]}"

if [ ${#FAILED_FUNCTIONS[@]} -gt 0 ]; then
    echo "Failed functions:"
    printf '%s\n' "${FAILED_FUNCTIONS[@]}"
    exit 1
fi

exit 0 