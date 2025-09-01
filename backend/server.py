from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError
import os
from typing import List, Dict, Any
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Location Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS DynamoDB configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

def get_dynamodb_client():
    """Initialize DynamoDB client with error handling"""
    try:
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            return boto3.client(
                'dynamodb',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            )
        else:
            # Fallback for local development or AWS IAM roles
            return boto3.client('dynamodb', region_name=AWS_REGION)
    except Exception as e:
        print(f"Error initializing DynamoDB client: {e}")
        return None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Location Tracker API is running",
        "version": "1.0.0",
        "endpoints": {
            "get_coordinates": "/api/coordinates/{table_name}",
            "health": "/api/health"
        }
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check with AWS connectivity"""
    dynamodb_client = get_dynamodb_client()
    
    health_status = {
        "status": "healthy",
        "services": {
            "api": "running",
            "dynamodb": "unknown"
        }
    }
    
    if dynamodb_client:
        try:
            # Test DynamoDB connection by listing tables
            response = dynamodb_client.list_tables(Limit=1)
            health_status["services"]["dynamodb"] = "connected"
        except Exception as e:
            health_status["services"]["dynamodb"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
    else:
        health_status["services"]["dynamodb"] = "not_configured"
        health_status["status"] = "degraded"
    
    return health_status

@app.get("/api/coordinates/{table_name}")
async def get_coordinates(table_name: str):
    """
    Fetch coordinates from DynamoDB table
    Expected table structure:
    - id (String): Primary key
    - title (String): Description/title for the coordinate
    - latitude (Number): Latitude coordinate
    - longitude (Number): Longitude coordinate
    """
    dynamodb_client = get_dynamodb_client()
    
    if not dynamodb_client:
        raise HTTPException(
            status_code=500, 
            detail="DynamoDB client not configured. Please check AWS credentials."
        )
    
    try:
        # Scan the table to get all items
        response = dynamodb_client.scan(
            TableName=table_name,
            ProjectionExpression='id, title, latitude, longitude'
        )
        
        coordinates = []
        for item in response.get('Items', []):
            try:
                coordinate = {
                    'id': item.get('id', {}).get('S', ''),
                    'title': item.get('title', {}).get('S', 'Untitled'),
                    'latitude': float(item.get('latitude', {}).get('N', '0')),
                    'longitude': float(item.get('longitude', {}).get('N', '0'))
                }
                coordinates.append(coordinate)
            except (ValueError, KeyError) as e:
                print(f"Error parsing item {item}: {e}")
                continue
        
        return {
            "table_name": table_name,
            "coordinates": coordinates,
            "count": len(coordinates)
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        
        if error_code == 'ResourceNotFoundException':
            raise HTTPException(
                status_code=404,
                detail=f"Table '{table_name}' not found in DynamoDB"
            )
        elif error_code == 'AccessDeniedException':
            raise HTTPException(
                status_code=403,
                detail="Access denied. Please check AWS credentials and permissions."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"DynamoDB error: {e.response['Error']['Message']}"
            )
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/test-data/{table_name}")
async def create_test_data(table_name: str):
    """
    Create test coordinate data in DynamoDB table (for development/testing)
    This endpoint creates sample coordinates for testing the map functionality
    """
    dynamodb_client = get_dynamodb_client()
    
    if not dynamodb_client:
        raise HTTPException(
            status_code=500, 
            detail="DynamoDB client not configured. Please check AWS credentials."
        )
    
    # Sample test coordinates (San Francisco area)
    test_coordinates = [
        {
            'id': {'S': 'test-1'},
            'title': {'S': 'Golden Gate Bridge'},
            'latitude': {'N': '37.8199'},
            'longitude': {'N': '-122.4783'}
        },
        {
            'id': {'S': 'test-2'},
            'title': {'S': 'Alcatraz Island'},
            'latitude': {'N': '37.8267'},
            'longitude': {'N': '-122.4233'}
        },
        {
            'id': {'S': 'test-3'},
            'title': {'S': 'Fisherman\'s Wharf'},
            'latitude': {'N': '37.8080'},
            'longitude': {'N': '-122.4177'}
        },
        {
            'id': {'S': 'test-4'},
            'title': {'S': 'Lombard Street'},
            'latitude': {'N': '37.8021'},
            'longitude': {'N': '-122.4187'}
        },
        {
            'id': {'S': 'test-5'},
            'title': {'S': 'Union Square'},
            'latitude': {'N': '37.7880'},
            'longitude': {'N': '-122.4074'}
        }
    ]
    
    try:
        # First, try to create the table if it doesn't exist
        try:
            dynamodb_client.create_table(
                TableName=table_name,
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S'
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            # Wait for table to be created
            waiter = dynamodb_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name, WaiterConfig={'Delay': 1, 'MaxAttempts': 30})
            
        except ClientError as e:
            if e.response['Error']['Code'] != 'ResourceInUseException':
                raise e
        
        # Insert test data
        for coordinate in test_coordinates:
            dynamodb_client.put_item(
                TableName=table_name,
                Item=coordinate
            )
        
        return {
            "message": f"Successfully created test data in table '{table_name}'",
            "coordinates_added": len(test_coordinates),
            "table_name": table_name
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        
        if error_code == 'AccessDeniedException':
            raise HTTPException(
                status_code=403,
                detail="Access denied. Please check AWS credentials and permissions."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"DynamoDB error: {e.response['Error']['Message']}"
            )
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)