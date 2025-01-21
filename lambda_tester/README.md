# Lambda Tester

This is an automated test suite for the OSRS Goal Tracker Lambda functions. It executes a series of integration tests by invoking the Lambda functions in sequence, validating the entire application flow.

## Features

- Tests all Lambda functions in the application
- Executes tests in parallel where possible
- Automatically cleans up test data after completion
- Can be run both locally and as a Lambda function
- Supports test data retention for debugging

## Test Chains

The tester executes the following test chains:

1. User Chain:
   - Creates a new user
   - Gets the user details
   - Adds a character to the user
   - Gets the user's characters
   - Creates a notification channel
   - Gets notification channels

2. Hiscores Chain:
   - Gets character hiscores

3. Goal Chain:
   - Creates a goal using the goal creation event

## Prerequisites

- Python 3.x
- AWS credentials configured (either via AWS CLI or environment variables)
- Required Python packages (install via `pip install -r requirements.txt`):
  - boto3
  - python-dotenv

## Running Locally

Basic usage:
```bash
python3 lambda_tester.py --table-name GoalTracker-dev
```

Options:
- `--table-name`: (Required) The name of the DynamoDB table to use
- `--retain-data`: (Optional) Flag to keep test data after completion. If not provided, test data will be cleaned up

Example with data retention:
```bash
python3 lambda_tester.py --table-name GoalTracker-dev --retain-data
```

## Running as a Lambda

When deployed as a Lambda function, invoke it with an event containing:
```json
{
  "table_name": "GoalTracker-dev",  // Required
  "retain_data": false              // Optional, defaults to false
}
```

## Environment Variables

The script uses the following environment variables:
- `AWS_REGION`: AWS region (defaults to us-west-2)
- `AWS_PROFILE`: AWS credentials profile
- `SSO_PROFILE`: AWS SSO profile (if using SSO)
- `LOCAL_PROFILE`: Local AWS profile
- `STAGE`: Deployment stage (defaults to 'dev')
- `DYNAMODB_TABLE`: DynamoDB table name (can be overridden by --table-name)

## Test Data Cleanup

By default, the tester cleans up all test data after completion. This includes:
- Deleting all items in the DynamoDB partition for the test user
- The cleanup uses the pattern `USER#<user-id>` to identify and remove all related items

To retain test data for debugging:
- Use the `--retain-data` flag when running locally
- Set `retain_data: true` in the Lambda event

## Output

The test results are returned in JSON format:
```json
{
  "passed": ["function1", "function2"],
  "failed": [
    {
      "function": "function3",
      "status": "FAIL",
      "statusCode": 500,
      "error": "error message"
    }
  ],
  "summary": {
    "total": 3,
    "passed": 2,
    "failed": 1
  }
}
``` 