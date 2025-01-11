#!/bin/bash

# Array of all Lambda function names
FUNCTIONS=(
    "CreateUser"
    "GetUser"
    "GetCharacterHiscores"
    "AddCharacterToUser"
    "GetCharactersForUser"
    "CreateNotificationChannelForUser"
    "GetNotificationChannelsForUser"
)

# Counter for successful updates
SUCCESS_COUNT=0
FAIL_COUNT=0

echo "Starting update of all Lambda functions..."

# Loop through each function and update it
for func in "${FUNCTIONS[@]}"; do
    echo -e "\nUpdating $func..."
    if ./updateDevLambda.sh "$func"; then
        ((SUCCESS_COUNT++))
        echo "✓ Successfully updated $func"
    else
        ((FAIL_COUNT++))
        echo "✗ Failed to update $func"
    fi
done

# Print summary
echo -e "\n=== Update Summary ==="
echo "Total functions: ${#FUNCTIONS[@]}"
echo "Successful updates: $SUCCESS_COUNT"
echo "Failed updates: $FAIL_COUNT"

# Exit with error if any updates failed
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "\n⚠️  Some updates failed. Check the logs above for details."
    exit 1
else
    echo -e "\n✅ All Lambda functions updated successfully!"
    exit 0
fi 