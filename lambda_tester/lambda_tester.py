import json
import boto3
import os
import uuid
import datetime
import concurrent.futures
from typing import List, Dict, Any
import sys
from pathlib import Path

def log(message: str):
    """Print log message with timestamp"""
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent / '.env'
    if not env_path.exists():
        print("Error: .env file not found")
        sys.exit(1)
    
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

# Load environment variables if running locally
if __name__ == '__main__':
    load_env()

# Configure AWS clients
region = os.environ.get('AWS_REGION', 'us-west-2')
profile = os.environ.get('AWS_PROFILE') or (
    os.environ.get('SSO_PROFILE') if os.environ.get('USE_SSO') == 'true'
    else os.environ.get('LOCAL_PROFILE')
)

session = boto3.Session(profile_name=profile, region_name=region)
lambda_client = session.client('lambda')
dynamodb = session.resource('dynamodb', region_name='us-west-2')

def create_api_gateway_event(test_case):
    """Create an API Gateway-like event for Lambda invocation."""
    return {
        'version': '2.0',
        'routeKey': '$default',
        'rawPath': '/',
        'rawQueryString': '',
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'accountId': '123456789012',
            'apiId': 'api-id',
            'domainName': 'test.execute-api.us-east-1.amazonaws.com',
            'domainPrefix': 'test',
            'http': {
                'method': 'POST',
                'path': '/',
                'protocol': 'HTTP/1.1',
                'sourceIp': '127.0.0.1',
                'userAgent': 'Custom-User-Agent'
            },
            'requestId': 'request-id',
            'routeKey': '$default',
            'stage': '$default',
            'time': '12/Mar/2024:19:03:58 +0000',
            'timeEpoch': 1710180238
        },
        **test_case
    }

def invoke_lambda(function_name: str, test_case: dict, stage: str) -> dict:
    """Invoke a Lambda function and return its response."""
    full_function_name = f"{function_name}-{stage}"
    test_event = create_api_gateway_event(test_case)

    log(f"Starting test: {function_name}")
    try:
        response = lambda_client.invoke(
            FunctionName=full_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )

        response_payload = json.loads(response['Payload'].read().decode())
        status_code = response_payload.get('statusCode', 500)

        if status_code != 200:
            error_body = response_payload.get('body')
            try:
                error_body = json.loads(error_body) if error_body else None
            except:
                pass
            log(f"Test failed: {function_name} (Status: {status_code})")
            if error_body:
                log(f"Error details: {error_body}")
        else:
            log(f"Test passed: {function_name}")

        return {
            'function': function_name,
            'status': 'PASS' if status_code == 200 else 'FAIL',
            'statusCode': status_code,
            'response': response_payload,
            'error': error_body if status_code != 200 else None
        }

    except Exception as e:
        log(f"Test error: {function_name} ({str(e)})")
        return {
            'function': function_name,
            'status': 'ERROR',
            'error': str(e)
        }

def execute_character_chain(stage: str, user_id: str) -> List[Dict[str, Any]]:
    """Execute character-related operations for a user."""
    log("Starting character chain tests...")
    results = []

    # Add Character to User
    add_character_result = invoke_lambda('AddCharacterToUser', {
        'pathParameters': {
            'userId': user_id,
            'name': 'characterN'
        }
    }, stage)
    results.append(add_character_result)

    # Get Characters for User (validate add character)
    if add_character_result['status'] == 'PASS':
        results.append(invoke_lambda('GetCharactersForUser', {
            'pathParameters': {
                'userId': user_id
            }
        }, stage))

    log("Completed character chain tests")
    return results

def execute_notification_chain(stage: str, user_id: str, email: str) -> List[Dict[str, Any]]:
    """Execute notification-related operations for a user."""
    log("Starting notification chain tests...")
    results = []

    # Create Notification Channel
    create_channel_result = invoke_lambda('CreateNotificationChannelForUser', {
        'pathParameters': {
            'userId': user_id
        },
        'body': json.dumps({
            'channelType': 'EMAIL',
            'identifier': email
        })
    }, stage)
    results.append(create_channel_result)

    # Get Notification Channels (validate create channel)
    if create_channel_result['status'] == 'PASS':
        results.append(invoke_lambda('GetNotificationChannelsForUser', {
            'pathParameters': {
                'userId': user_id
            }
        }, stage))

    log("Completed notification chain tests")
    return results

def execute_user_chain(stage: str, test_email: str) -> List[Dict[str, Any]]:
    """Execute the user-related Lambda chain with parallel sub-chains."""
    log("Starting user chain tests...")
    results = []

    # Step 1: Create User (root of the tree)
    create_user_result = invoke_lambda('CreateUser', {
        'body': json.dumps({
            'email': test_email
        })
    }, stage)
    results.append(create_user_result)

    if create_user_result['status'] == 'PASS':
        response_body = json.loads(create_user_result['response'].get('body', '{}'))
        user_id = response_body.get('userId')

        # Step 2: Get User (validates create user)
        get_user_result = invoke_lambda('GetUser', {
            'pathParameters': {
                'userId': user_id
            }
        }, stage)
        results.append(get_user_result)

        if get_user_result['status'] == 'PASS':
            log("Starting parallel character and notification chains...")
            # Execute character and notification chains in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                # Submit independent chains
                character_chain = executor.submit(execute_character_chain, stage, user_id)
                notification_chain = executor.submit(execute_notification_chain, stage, user_id, test_email)

                # Gather results from all chains
                results.extend(character_chain.result())
                results.extend(notification_chain.result())
            log("Completed parallel chains")

    log("Completed user chain tests")
    return results

def execute_hiscores_chain(stage: str) -> List[Dict[str, Any]]:
    """Execute the hiscores Lambda chain (independent of user)."""
    log("Starting hiscores chain test...")
    results = [invoke_lambda('GetCharacterHiscores', {
        'pathParameters': {
            'name': 'SoloMission'
        }
    }, stage)]
    log("Completed hiscores chain test")
    return results

def execute_goal_chain(stage: str, user_id: str, character_name: str) -> List[Dict[str, Any]]:
    """Execute goal creation test."""
    log("Starting goal creation test...")
    results = []

    # Create a goal using direct lambda invocation
    goal_creation_event = {
        'version': '0',
        'id': 'test-event-id',
        'detail-type': 'Goal Creation Request',
        'source': 'osrs.goals',
        'account': '123456789012',
        'time': '2024-03-20T15:00:00Z',
        'region': 'us-east-1',
        'detail': {
            'userId': user_id,
            'characterName': character_name,
            'targetAttribute': 'SMITHING',
            'targetType': 'SKILL',
            'targetValue': 99,
            'currentValue': 1,
            'targetDate': '2024-12-31T23:59:59Z',
            'notificationChannelType': 'DISCORD',
            'frequency': 'WEEKLY'
        }
    }

    # Note: For this lambda, we pass the event directly without API Gateway wrapping
    create_goal_result = invoke_lambda_direct('CreateGoalFromGoalCreationRequestEvent', goal_creation_event, stage)
    results.append(create_goal_result)

    log("Completed goal creation test")
    return results

def invoke_lambda_direct(function_name: str, event: dict, stage: str) -> dict:
    """Invoke a Lambda function directly without API Gateway wrapping and return its response."""
    full_function_name = f"{function_name}-{stage}"

    log(f"Starting test: {function_name}")
    try:
        response = lambda_client.invoke(
            FunctionName=full_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )

        response_payload = json.loads(response['Payload'].read().decode())
        
        # Check if the response is an error
        if isinstance(response_payload, dict) and 'errorMessage' in response_payload:
            log(f"Test failed: {function_name}")
            log(f"Error details: {response_payload['errorMessage']}")
            return {
                'function': function_name,
                'status': 'FAIL',
                'error': response_payload['errorMessage']
            }
        
        log(f"Test passed: {function_name}")
        return {
            'function': function_name,
            'status': 'PASS',
            'response': response_payload
        }

    except Exception as e:
        log(f"Test error: {function_name} ({str(e)})")
        return {
            'function': function_name,
            'status': 'ERROR',
            'error': str(e)
        }

def cleanup_test_data(table_name: str, user_id: str):
    """Delete all items in the partition for a given user ID."""
    if not table_name:
        raise ValueError("DynamoDB table name must be provided")
    
    table = dynamodb.Table(table_name)
    
    # Query all items in the partition
    response = table.query(
        KeyConditionExpression='pk = :pk',
        ExpressionAttributeValues={
            ':pk': f"USER#{user_id}"
        }
    )
    
    # Delete all items found
    with table.batch_writer() as batch:
        for item in response['Items']:
            batch.delete_item(
                Key={
                    'pk': item['pk'],
                    'sk': item['sk']
                }
            )
    
    log(f"Cleaned up test data for user {user_id}")

def run_tests(stage: str = None, retain_data: bool = False, table_name: str = None) -> dict:
    """Run all tests and return results. If stage is None, use environment variable."""
    if stage is None:
        stage = os.environ.get('STAGE', 'dev')
    
    if table_name is None:
        table_name = os.environ.get('DYNAMODB_TABLE')
    
    if not table_name:
        raise ValueError("DynamoDB table name must be provided either as an argument or DYNAMODB_TABLE environment variable")
    
    test_email = f"{uuid.uuid4()}@email.com"
    log(f"Starting all tests in stage: {stage}")
    log(f"Using test email: {test_email}")
    results = []
    user_id = None

    try:
        # Execute main chains concurrently
        log("Starting parallel test chains...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            # Submit both main chains
            user_chain = executor.submit(execute_user_chain, stage, test_email)
            hiscores_chain = executor.submit(execute_hiscores_chain, stage)

            # Gather results
            user_results = user_chain.result()
            results.extend(user_results)
            results.extend(hiscores_chain.result())

            # Extract user_id and character_name from user chain results
            character_name = None
            for result in user_results:
                if result['function'] == 'CreateUser' and result['status'] == 'PASS':
                    response_body = json.loads(result['response'].get('body', '{}'))
                    user_id = response_body.get('userId')
                elif result['function'] == 'AddCharacterToUser' and result['status'] == 'PASS':
                    character_name = 'characterN'  # This matches the name used in execute_character_chain

            # If we have both user_id and character_name, execute goal chain
            if user_id and character_name:
                results.extend(execute_goal_chain(stage, user_id, character_name))

        log("Completed all parallel test chains")

    finally:
        # Clean up test data unless retain_data is True
        if user_id and not retain_data:
            try:
                cleanup_test_data(table_name, user_id)
            except Exception as e:
                log(f"Warning: Failed to clean up test data: {str(e)}")

    # Process results into a cleaner format
    passed_tests = [r['function'] for r in results if r['status'] == 'PASS']
    failed_tests = [{
        'function': r['function'],
        'status': r['status'],
        'statusCode': r.get('statusCode'),
        'error': r['error']
    } for r in results if r['status'] != 'PASS']

    log(f"Tests completed. Passed: {len(passed_tests)}, Failed: {len(failed_tests)}")
    return {
        'passed': passed_tests,
        'failed': failed_tests,
        'summary': {
            'total': len(results),
            'passed': len(passed_tests),
            'failed': len(failed_tests)
        }
    }

def handler(event, context):
    """AWS Lambda handler."""
    retain_data = event.get('retain_data', False)
    table_name = event.get('table_name')
    if not table_name:
        raise ValueError("table_name must be provided in the event")
    return run_tests(retain_data=retain_data, table_name=table_name)

if __name__ == '__main__':
    """Allow running the script locally."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run OSRS Goal Tracker tests')
    parser.add_argument('--retain-data', action='store_true', help='Retain test data after completion')
    parser.add_argument('--table-name', required=True, help='DynamoDB table name (required)')
    args = parser.parse_args()
    
    results = run_tests(retain_data=args.retain_data, table_name=args.table_name)
    print(json.dumps(results, indent=2)) 