from ultralytics import YOLO

model = YOLO("yolov8.pt")

model.export(format="onnx", 
             imgsz=640,
             simplify=True,
             opset=12)

