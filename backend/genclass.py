
from ultralytics import YOLO
model = YOLO("yolov8.pt")
import json
with open("classes.json", "w") as f:
    json.dump(model.names, f, indent=2)
print("Saved classes.json")