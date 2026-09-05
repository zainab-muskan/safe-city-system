import requests
import cv2
import time
import os
import sys

# Configuration
NODE_BACKEND_URL = "http://localhost:5000/api"
FASTAPI_URL = "http://localhost:8000/detect"

# Operator Credentials (required to post incidents)
OPERATOR_EMAIL = "admin@safecity.pk"
OPERATOR_PASSWORD = "Admin@123"

# How often to process a frame from the live video (in seconds)
# e.g., 1.0 = process 1 frame every second (to save CPU/Network)
PROCESS_INTERVAL = 1.0 

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
    """Fetch available cameras and let the user choose which one this feed represents"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{NODE_BACKEND_URL}/cameras", headers=headers)
        if response.status_code == 200:
            cameras = response.json()
            if len(cameras) == 0:
                print("Warning: No camera found in database. You must create one first!")
                sys.exit(1)
                
            if len(cameras) == 1:
                print(f"Only 1 camera found. Auto-selecting: {cameras[0]['name']}")
                return cameras[0]["_id"]
                
            # If multiple cameras exist, let the user choose!
            print("\nMultiple cameras found in the system. Which one is this video feed for?")
            for i, cam in enumerate(cameras):
                print(f"  [{i+1}] {cam['name']}")
                
            while True:
                try:
                    choice = int(input("\nEnter camera number: "))
                    if 1 <= choice <= len(cameras):
                        selected = cameras[choice-1]
                        print(f"✅ Successfully linked this video feed to: {selected['name']}\n")
                        return selected["_id"]
                    else:
                        print("Invalid choice, try again.")
                except ValueError:
                    print("Please enter a valid number.")
                    
    except Exception as e:
        print(f"Error fetching cameras: {e}")
        sys.exit(1)

def send_frame_to_ai(frame, token, camera_id):
    """Encode OpenCV frame to JPEG and send to FastAPI"""
    # 1. Encode the frame to JPEG in memory
    success, encoded_image = cv2.imencode('.jpg', frame)
    if not success:
        print("Failed to encode frame")
        return

    # 2. Send to FastAPI
    files = {"file": ("frame.jpg", encoded_image.tobytes(), "image/jpeg")}
    try:
        ai_response = requests.post(FASTAPI_URL, files=files)
        
        if ai_response.status_code == 200:
            detections = ai_response.json().get("detections", [])
            
            if len(detections) > 0:
                print(f"    AI Core found {len(detections)} vehicles with plates.")
                
            headers = {"Authorization": f"Bearer {token}"}
            
            for det in detections:
                plate = det["plate_text"]
                v_type = det["vehicle_type"]
                
                print(f"    [!] Detected plate [{plate}] ({v_type}). Checking Registry...")
                
                payload = {
                    "detectedPlateText": plate,
                    "detectedModel": v_type,
                    "detectedColor": "Unknown",
                    "cameraId": camera_id,
                    "snapshotB64": det.get("crop_b64")
                }
                
                node_resp = requests.post(f"{NODE_BACKEND_URL}/incidents/ai-detect", json=payload, headers=headers)
                
                if node_resp.status_code == 201:
                    print(f"    🚨 THREAT DETECTED! Incident created for {plate}.")
                elif node_resp.status_code == 200:
                    print(f"    ✅ Vehicle {plate} is clear.")
                else:
                    print(f"    ❌ Backend Error {node_resp.status_code}: {node_resp.text}")
                    
    except Exception as e:
        print(f"Error processing frame: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python rtsp_stream.py <RTSP_URL_OR_VIDEO_FILE>")
        print("Example: python rtsp_stream.py rtsp://admin:12345@192.168.1.100:554/stream1")
        print("Example: python rtsp_stream.py highway_traffic.mp4")
        sys.exit(1)
        
    video_source = sys.argv[1]
    
    # If the user passed '0' for their laptop webcam, convert it to an integer
    if video_source.isdigit():
        video_source = int(video_source)

    # 1. Authenticate
    token = get_auth_token()
    
    # 2. Get Camera ID
    camera_id = get_camera_id(token)
    
    # 3. Connect to the RTSP Stream or Video File
    print(f"\nConnecting to video source: {video_source}")
    cap = cv2.VideoCapture(video_source)
    
    if not cap.isOpened():
        print(f"Error: Could not open video source {video_source}")
        sys.exit(1)
        
    print("Stream connected! Press Ctrl+C to stop.\n")
    
    # Check if GUI display is available
    gui_available = True
    try:
        cv2.namedWindow("test")
        cv2.destroyWindow("test")
    except cv2.error:
        gui_available = False
        print("(Running in headless mode - no video window)")
    
    last_process_time = time.time()
    frame_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("End of stream or connection lost.")
                break
                
            current_time = time.time()
            
            if (current_time - last_process_time) >= PROCESS_INTERVAL:
                frame_count += 1
                print(f"[Frame {frame_count}] Processing...")
                
                # Show live feed if GUI is available
                if gui_available:
                    cv2.imshow("Safe City Live Stream (Press 'q' to quit)", frame)
                
                send_frame_to_ai(frame, token, camera_id)
                last_process_time = current_time
                
            # Check for quit key (only if GUI is available)
            if gui_available:
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
    except KeyboardInterrupt:
        print("\nStopping stream...")
    finally:
        cap.release()
        if gui_available:
            cv2.destroyAllWindows()
        print("Stream closed.")
