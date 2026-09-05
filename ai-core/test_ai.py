from ultralytics import YOLO

# 1. Load the pre-trained lightweight YOLOv8 model (it will auto-download 'yolov8n.pt')
model = YOLO('yolov8n.pt')

# 2. Run vehicle detection on your image
results = model('car.jpg', save=True)

print("Detection complete! Check your ai-core folder for a new 'runs/detect' directory.")