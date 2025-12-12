import json
import os
import uuid
import boto3
from datetime import datetime
from decimal import Decimal

# --- Configuration ---
#If there are MSDA students after me then know that this is so you can deploy your own version of this app. 
#Have so much fun with his
PROCESSES_TABLE_NAME = os.environ.get("PROCESSES_TABLE_NAME")
WORK_LOGS_TABLE_NAME = os.environ.get("WORK_LOGS_TABLE_NAME")
INGESTION_BUCKET_NAME = os.environ.get("INGESTION_BUCKET_NAME")

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

processes_table = dynamodb.Table(PROCESSES_TABLE_NAME)
work_logs_table = dynamodb.Table(WORK_LOGS_TABLE_NAME)

# Helper for Decimal serialization (DynamoDB returns Decimals)
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" # CORS for frontend
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }

# --- Handlers ---

def get_processes(event, context):
    try:
        # Efficiently we might want a GSI for is_active, but scan is fine for low volume
        response = processes_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('is_active').eq(True)
        )
        items = response.get('Items', [])
        return _response(200, items)
    except Exception as e:
        print(f"Error fetching processes: {e}")
        return _response(500, {"error": str(e)})

def create_process(event, context):
    try:
        body = json.loads(event['body'])
        new_process = {
            "id": str(uuid.uuid4()),
            "name": body.get("name"),
            "description": body.get("description", ""),
            "estimated_duration": body.get("estimated_duration", 0),
            "is_active": True,
            "category": body.get("category", "general")
        }

        processes_table.put_item(Item=new_process)
        return _response(201, new_process)
    except Exception as e:
        print(f"Error creating process: {e}")
        return _response(500, {"error": str(e)})

def delete_process(event, context):
    try:
        process_id = event['pathParameters']['id']
        processes_table.delete_item(Key={'id': process_id})
        return _response(200, {"message": "Process deleted"})
    except Exception as e:
        print(f"Error deleting process: {e}")
        return _response(500, {"error": str(e)})

def start_work(event, context):
    try:
        body = json.loads(event['body'])
        person_name = body.get("person_name")
        process_id = body.get("process_id")
        process_name = body.get("process_name")

        if not person_name or not process_id:
            return _response(400, {"error": "Missing required fields"})

        new_log = {
            "id": str(uuid.uuid4()),
            "person_name": person_name,
            "process_id": process_id,
            "process_name": process_name,
            "start_timestamp": datetime.utcnow().isoformat() + "Z",
            "end_timestamp": None,
            "duration": None,
            "status": "RUNNING"
        }
        
        work_logs_table.put_item(Item=new_log)
        return _response(201, new_log)
    except Exception as e:
        print(f"Error starting work: {e}")
        return _response(500, {"error": str(e)})

def stop_work(event, context):
    try:
        body = json.loads(event['body'])
        log_id = body.get("id")
        person_name = body.get("person_name")
        
        if not log_id:
            return _response(400, {"error": "Missing ID"})

        # Get current item
        resp = work_logs_table.get_item(Key={'id': log_id})
        if 'Item' not in resp:
            return _response(404, {"error": "Work log not found"})
            
        item = resp['Item']

        if item.get("status") == "COMPLETED":
            return _response(409, {"error": "Work already completed"})

        # Update fields
        end_time_str = datetime.utcnow().isoformat() + "Z"
        start_time = datetime.fromisoformat(item["start_timestamp"].replace("Z", ""))
        end_time = datetime.utcnow()
        duration_seconds = int((end_time - start_time).total_seconds())

        # Update expression
        work_logs_table.update_item(
            Key={'id': log_id},
            UpdateExpression="set end_timestamp=:e, #d=:d, #s=:s",
            ExpressionAttributeNames={
                '#d': 'duration',
                '#s': 'status'
            },
            ExpressionAttributeValues={
                ':e': end_time_str,
                ':d': duration_seconds,
                ':s': 'COMPLETED'
            },
            ReturnValues="ALL_NEW"
        )
        
        # We need to return the updated item. 
        # The update_item response contains Attributes.
        updated_item = item.copy()
        updated_item.update({
            "end_timestamp": end_time_str,
            "duration": duration_seconds,
            "status": "COMPLETED"
        })
        
        return _response(200, updated_item)

    except Exception as e:
        print(f"Error stopping work: {e}")
        return _response(500, {"error": str(e)})

def stream_processor(event, context):
    """
    Triggered by DynamoDB Streams.
    """
    try:
        for record in event['Records']:
            if record['eventName'] == 'MODIFY':
                new_image = record['dynamodb']['NewImage']
                
                # Deserialization from DynamoDB JSON format is needed
                # But we can check status simply
                status_dict = new_image.get('status', {})
                status_val = status_dict.get('S') # String
                
                if status_val == 'COMPLETED':
                    # Unmarshall
                    from boto3.dynamodb.types import TypeDeserializer
                    deserializer = TypeDeserializer()
                    python_data = {k: deserializer.deserialize(v) for k, v in new_image.items()}
                    
                    # Add metadata
                    python_data['_metadata'] = {
                        "ingested_at": datetime.utcnow().isoformat() + "Z"
                    }
                    
                    file_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{python_data['id']}.json"
                    
                    s3_client.put_object(
                        Bucket=INGESTION_BUCKET_NAME,
                        Key=file_name,
                        Body=json.dumps(python_data, cls=DecimalEncoder)
                    )
                    print(f"Ingested {file_name} to S3")
                    
    except Exception as e:
        print(f"Stream processing error: {e}")
        raise e # Raise to ensure Lambda marks batch as failed if needed, though for streams handling partial failures is safer.
