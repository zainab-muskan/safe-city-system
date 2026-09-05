from ultralytics import YOLO

if __name__ == '__main__':
    model = YOLO("runs/detect/train-4/weights/best.pt")

    # Pick an actual balloon image from your dataset folder!
    # (Replace 'your_balloon_image.jpg' with the real filename inside dataset/train/images)
    results = model("dataset/train/images/1.jpg", show=True, conf=0.1)

    print("Inference completed!")