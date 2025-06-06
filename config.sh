#!/bin/bash

# Stack Names
GOAL_TRACKER_TABLE_STACK="GoalTrackerTableStack"
GET_CHARACTER_HISCORES_STACK="GetCharacterHiscoresStack"
CREATE_USER_STACK="CreateUserStack"
GET_USER_STACK="GetUserStack"
ADD_CHARACTER_TO_USER_STACK="AddCharacterToUserStack"
GET_CHARACTERS_FOR_USER_STACK="GetCharactersForUserStack"
CREATE_NOTIFICATION_CHANNEL_FOR_USER_STACK="CreateNotificationChannelForUserStack"
GET_NOTIFICATION_CHANNELS_FOR_USER_STACK="GetNotificationChannelsForUserStack"
GOAL_EVENT_BUS_STACK="GoalEventBusStack"
CREATE_GOAL_FROM_EVENT_STACK="CreateGoalFromGoalCreationRequestEventStack"
GOAL_CREATION_REQUEST_EVENT_PRODUCER_STACK="GoalCreationRequestEventProducerStack"
GOAL_PROGRESS_CREATOR_STACK="GoalProgressCreatorStack"
API_GATEWAY_STACK="ApiGatewayStack"

# Lambda Function Names (without stage suffix)
CREATE_USER_LAMBDA="CreateUser"
GET_USER_LAMBDA="GetUser"
GET_CHARACTER_HISCORES_LAMBDA="GetCharacterHiscores"
ADD_CHARACTER_TO_USER_LAMBDA="AddCharacterToUser"
GET_CHARACTERS_FOR_USER_LAMBDA="GetCharactersForUser"
CREATE_NOTIFICATION_CHANNEL_FOR_USER_LAMBDA="CreateNotificationChannelForUser"
GET_NOTIFICATION_CHANNELS_FOR_USER_LAMBDA="GetNotificationChannelsForUser"
CREATE_GOAL_FROM_EVENT_LAMBDA="CreateGoalFromGoalCreationRequestEvent"
GOAL_CREATION_REQUEST_EVENT_PRODUCER_LAMBDA="GoalCreationRequestEventProducer"
GOAL_PROGRESS_CREATOR_LAMBDA="GoalProgressCreator"

# Jar Names (without version suffix)
CREATE_USER_JAR="createUser"
GET_USER_JAR="getUser"
GET_CHARACTER_HISCORES_JAR="getCharacterHiscores"
ADD_CHARACTER_TO_USER_JAR="addCharacterToUser"
GET_CHARACTERS_FOR_USER_JAR="getCharactersForUser"
CREATE_NOTIFICATION_CHANNEL_FOR_USER_JAR="createNotificationChannelForUser"
GET_NOTIFICATION_CHANNELS_FOR_USER_JAR="getNotificationChannelsForUser"
CREATE_GOAL_FROM_EVENT_JAR="createGoalFromGoalCreationRequestEvent"
GOAL_CREATION_REQUEST_EVENT_PRODUCER_JAR="goalCreationRequestEventProducer"
GOAL_PROGRESS_CREATOR_JAR="createGoalProgressItem"

# Function to get jar name from lambda name
get_jar_name() {
    case "$1" in
        "$CREATE_USER_LAMBDA") echo "$CREATE_USER_JAR" ;;
        "$GET_USER_LAMBDA") echo "$GET_USER_JAR" ;;
        "$GET_CHARACTER_HISCORES_LAMBDA") echo "$GET_CHARACTER_HISCORES_JAR" ;;
        "$ADD_CHARACTER_TO_USER_LAMBDA") echo "$ADD_CHARACTER_TO_USER_JAR" ;;
        "$GET_CHARACTERS_FOR_USER_LAMBDA") echo "$GET_CHARACTERS_FOR_USER_JAR" ;;
        "$CREATE_NOTIFICATION_CHANNEL_FOR_USER_LAMBDA") echo "$CREATE_NOTIFICATION_CHANNEL_FOR_USER_JAR" ;;
        "$GET_NOTIFICATION_CHANNELS_FOR_USER_LAMBDA") echo "$GET_NOTIFICATION_CHANNELS_FOR_USER_JAR" ;;
        "$CREATE_GOAL_FROM_EVENT_LAMBDA") echo "$CREATE_GOAL_FROM_EVENT_JAR" ;;
        "$GOAL_CREATION_REQUEST_EVENT_PRODUCER_LAMBDA") echo "$GOAL_CREATION_REQUEST_EVENT_PRODUCER_JAR" ;;
        "$GOAL_PROGRESS_CREATOR_LAMBDA") echo "$GOAL_PROGRESS_CREATOR_JAR" ;;
        *) echo "" ;;
    esac
}

# Function to list all lambda functions
list_lambda_functions() {
    echo "Available functions:"
    echo "  - $CREATE_USER_LAMBDA"
    echo "  - $GET_USER_LAMBDA"
    echo "  - $GET_CHARACTER_HISCORES_LAMBDA"
    echo "  - $ADD_CHARACTER_TO_USER_LAMBDA"
    echo "  - $GET_CHARACTERS_FOR_USER_LAMBDA"
    echo "  - $CREATE_NOTIFICATION_CHANNEL_FOR_USER_LAMBDA"
    echo "  - $GET_NOTIFICATION_CHANNELS_FOR_USER_LAMBDA"
    echo "  - $CREATE_GOAL_FROM_EVENT_LAMBDA"
    echo "  - $GOAL_CREATION_REQUEST_EVENT_PRODUCER_LAMBDA"
    echo "  - $GOAL_PROGRESS_CREATOR_LAMBDA"
}

# Function to validate lambda name
validate_lambda_name() {
    case "$1" in
        "$CREATE_USER_LAMBDA"|"$GET_USER_LAMBDA"|"$GET_CHARACTER_HISCORES_LAMBDA"|"$ADD_CHARACTER_TO_USER_LAMBDA"|"$GET_CHARACTERS_FOR_USER_LAMBDA"|"$CREATE_NOTIFICATION_CHANNEL_FOR_USER_LAMBDA"|"$GET_NOTIFICATION_CHANNELS_FOR_USER_LAMBDA"|"$CREATE_GOAL_FROM_EVENT_LAMBDA"|"$GOAL_CREATION_REQUEST_EVENT_PRODUCER_LAMBDA"|"$GOAL_PROGRESS_CREATOR_LAMBDA")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
} 