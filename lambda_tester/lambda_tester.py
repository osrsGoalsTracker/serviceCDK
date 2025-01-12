import json
import boto3
import os
import uuid
import concurrent.futures
from typing import List, Dict, Any

lambda_client = boto3.client('lambda')

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
        
        return {
            'function': function_name,
            'status': 'PASS' if status_code == 200 else 'FAIL',
            'statusCode': status_code,
            'response': response_payload,
            'error': error_body if status_code != 200 else None
        }
        
    except Exception as e:
        return {
            'function': function_name,
            'status': 'ERROR',
            'error': str(e)
        }

def execute_character_chain(stage: str, user_id: str) -> List[Dict[str, Any]]:
    """Execute character-related operations for a user."""
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
    
    return results

def execute_notification_chain(stage: str, user_id: str, email: str) -> List[Dict[str, Any]]:
    """Execute notification-related operations for a user."""
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
    
    return results

def execute_user_chain(stage: str, test_email: str) -> List[Dict[str, Any]]:
    """Execute the user-related Lambda chain with parallel sub-chains."""
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
            # Execute character and notification chains in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                # Submit independent chains
                character_chain = executor.submit(execute_character_chain, stage, user_id)
                notification_chain = executor.submit(execute_notification_chain, stage, user_id, test_email)

                # Gather results from all chains
                results.extend(character_chain.result())
                results.extend(notification_chain.result())
    
    return results

def execute_hiscores_chain(stage: str) -> List[Dict[str, Any]]:
    """Execute the hiscores Lambda chain (independent of user)."""
    return [invoke_lambda('GetCharacterHiscores', {
        'pathParameters': {
            'name': 'SoloMission'
        }
    }, stage)]

def handler(event, context):
    """Test all Lambda functions and return results."""
    stage = os.environ.get('STAGE', 'dev')
    test_email = f"{uuid.uuid4()}@email.com"
    results = []

    # Execute main chains concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        # Submit both main chains
        user_chain = executor.submit(execute_user_chain, stage, test_email)
        hiscores_chain = executor.submit(execute_hiscores_chain, stage)

        # Gather results
        results.extend(user_chain.result())
        results.extend(hiscores_chain.result())
    
    # Process results into a cleaner format
    passed_tests = [r['function'] for r in results if r['status'] == 'PASS']
    failed_tests = [{
        'function': r['function'],
        'status': r['status'],
        'statusCode': r.get('statusCode'),
        'error': r['error']
    } for r in results if r['status'] != 'PASS']
    
    return {
        'passed': passed_tests,
        'failed': failed_tests,
        'summary': {
            'total': len(results),
            'passed': len(passed_tests),
            'failed': len(failed_tests)
        }
    } 