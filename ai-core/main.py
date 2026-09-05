from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO
import cv2
import numpy as np
import easyocr
import re
import base64

app = FastAPI()

# 1. Load the YOLOv8 model for vehicle detection
model = YOLO("yolov8n.pt") 

# 2. Initialize EasyOCR reader (English). Uses GPU if available.
print("Initializing EasyOCR...")
reader = easyocr.Reader(['en'])
print("EasyOCR ready.")

# COCO Class IDs for vehicles we care about
VEHICLE_CLASSES = {2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}

def clean_plate_text(text):
    """Remove spaces and special characters from OCR text"""
    cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
    return cleaned if len(cleaned) >= 3 else None

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    # Read the uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Run YOLO inference
    results = model(img)
    detections = []

    for r in results:
        boxes = r.boxes
        print(f"YOLO found {len(boxes)} total objects")
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            
            # Only process if it's a vehicle and confidence > 30%
            if cls_id in VEHICLE_CLASSES and conf > 0.3:
                vehicle_type = VEHICLE_CLASSES[cls_id]
                print(f"-> Detected {vehicle_type} with {conf:.2f} confidence")
                
                # Extract coordinates (x1, y1, x2, y2)
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                
                # Crop the vehicle from the image
                h, w, _ = img.shape
                crop_y1 = max(0, y1 - 10)
                crop_y2 = min(h, y2 + 10)
                crop_x1 = max(0, x1 - 10)
                crop_x2 = min(w, x2 + 10)
                
                vehicle_crop = img[crop_y1:crop_y2, crop_x1:crop_x2]
                
                if vehicle_crop.shape[0] < 20 or vehicle_crop.shape[1] < 20:
                    print("   -> Crop too small, skipping OCR")
                    continue
                
                # Run OCR
                ocr_results = reader.readtext(vehicle_crop, detail=1)
                print(f"   -> OCR found {len(ocr_results)} text blocks")
                
                plate_text = None
                highest_conf = 0
                
                for (_, text, text_conf) in ocr_results:
                    print(f"      - Text: '{text}', Conf: {text_conf:.2f}")
                    cleaned = clean_plate_text(text)
                    if cleaned and text_conf > highest_conf:
                        highest_conf = text_conf
                        plate_text = cleaned
                
                if plate_text:
                    print(f"   -> Final extracted plate: {plate_text}")
                    
                    # 5. Encode crop to Base64 to send to Node.js
                    success, buffer = cv2.imencode('.jpg', vehicle_crop)
                    crop_b64 = None
                    if success:
                        crop_b64 = base64.b64encode(buffer).decode('utf-8')
                        
                    detections.append({
                        "vehicle_type": vehicle_type,
                        "confidence": round(conf, 2),
                        "plate_text": plate_text,
                        "plate_confidence": round(highest_conf, 2),
                        "box": [x1, y1, x2, y2],
                        "crop_b64": crop_b64
                    })
                else:
                    print("   -> No valid plate text extracted")

    print(f"Returning {len(detections)} valid detections")
    return {"detections": detections}