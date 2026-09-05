from ultralytics import YOLO

if __name__ == '__main__':
    # Load a pretrained YOLOv8 model
    model = YOLO("yolov8n.pt")

    # Start training using your Roboflow data.yaml
    results = model.train(
        data="data.yaml", 
        epochs=25,       
        imgsz=640,       
        batch=4          
    )

    print("Training finished successfully!")