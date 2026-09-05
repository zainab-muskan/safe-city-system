import requests
import time
import os
import sys

# Configuration
NODE_BACKEND_URL = "http://localhost:5000/api"
FASTAPI_URL = "http://localhost:8000/detect"

# Operator Credentials (required to post incidents)
OPERATOR_EMAIL = "admin@safecity.pk"
OPERATOR_PASSWORD = "Admin@123"

# The test camera ID (You should replace this with a real camera ID from your MongoDB)
# For testing, we'll try to fetch a camera ID from the backend.
CAMERA_ID = None

def get_auth_token():
    """Login to Node.js backend to get JWT token"""
    print("Logging into Node.js backend...")
    try:
        response = requests.post(f"{NODE_BACKEND_URL}/auth/login", json={
            "email": OPERATOR_EMAIL,
            "password": OPERATOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            print("Login successful! Token acquired.")
            return token
        else:
            print(f"Login failed: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Could not connect to Node backend: {e}")
        sys.exit(1)

def get_camera_id(token):
    """Fetch the first available camera from the backend to use as a dummy source"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{NODE_BACKEND_URL}/cameras", headers=headers)
        if response.status_code == 200:
            cameras = response.json()
            if len(cameras) > 0:
                print(f"Using camera: {cameras[0]['name']}")
                return cameras[0]["_id"]
    except Exception as e:
        pass
    print("Warning: No camera found in database. You must create one first!")
    sys.exit(1)

def process_frame(image_path, token, camera_id):
    """Send frame to FastAPI, then send detected plates to Node.js"""
    print(f"\n[1] Sending {image_path} to AI Core (FastAPI)...")
    
    try:
        with open(image_path, "rb") as f:
            files = {"file": (os.path.basename(image_path), f, "image/jpeg")}
            ai_response = requests.post(FASTAPI_URL, files=files)
            
        if ai_response.status_code == 200:
            detections = ai_response.json().get("detections", [])
            print(f"    AI Core found {len(detections)} vehicles with plates.")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            for det in detections:
                plate = det["plate_text"]
                v_type = det["vehicle_type"]
                conf = det["plate_confidence"]
                
                print(f"\n[2] Sending plate [{plate}] ({v_type}) to Node.js Registry...")
                
                # Send to our new ai-detect endpoint
                payload = {
                    "detectedPlateText": plate,
                    "detectedModel": v_type,
                    "detectedColor": "Unknown",
                    "cameraId": camera_id
                }
                
                node_resp = requests.post(f"{NODE_BACKEND_URL}/incidents/ai-detect", json=payload, headers=headers)
                
                if node_resp.status_code == 201:
                    print(f"    🚨 THREAT DETECTED! Incident created for {plate}.")
                elif node_resp.status_code == 200:
                    print(f"    ✅ Vehicle {plate} is clear (No incident created).")
                else:
                    print(f"    Error from Node.js: {node_resp.text}")
                    
        else:
            print(f"AI Core Error: {ai_response.text}")
            
    except Exception as e:
        print(f"Error processing frame: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python camera_stream.py <image_path>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        sys.exit(1)

    # 1. Authenticate
    token = get_auth_token()
    
    # 2. Get a valid camera ID
    camera_id = get_camera_id(token)
    
    # 3. Simulate camera frame processing
    process_frame(image_path, token, camera_id)
