from flask import Flask
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2, base64, numpy as np, time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

model = YOLO("best.pt")
print("✅ Model loaded successfully with classes:", model.names)

CONF_THRESHOLD = 0.8
IOU_THRESHOLD = 0.5

def parse_class_name(class_name: str):
    parts = class_name.lower().split('_')

    label = 'Tomato' if 'tomato' in parts else 'Bellpepper'

    if 'damaged' in parts:
        color = 'damaged'
    elif 'red' in parts:
        color = 'red'
    elif 'green' in parts:
        color = 'green'
    else:
        color = 'unknown'

    size = next((p for p in ['small', 'medium', 'large'] if p in parts), 'unknown')
    return label, color, size


@app.route('/')
def index():
    return "✅ Flask YOLO WebSocket Server is running!"

@socketio.on('connect')
def handle_connect():
    print("📡 Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("❌ Client disconnected")

def iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    unionArea = boxAArea + boxBArea - interArea
    return interArea / unionArea if unionArea > 0 else 0

@socketio.on('frame')
def handle_frame(data):
    start_time = time.time()
    try:
        img_data = base64.b64decode(data.split(',')[1])
        img_array = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            emit('error', {'message': 'Invalid image data'})
            return

        results = model.predict(img, verbose=False)
        boxes = results[0].boxes

        counter_data = {
            "Tomato": {
                "total": {"green": 0, "damaged": 0, "red": 0},
                "small": {"green": 0, "damaged": 0, "red": 0},
                "medium": {"green": 0, "damaged": 0, "red": 0},
                "large": {"green": 0, "damaged": 0, "red": 0},
            },
            "Bellpepper": {
                "total": {"green": 0, "damaged": 0, "red": 0},
                "small": {"green": 0, "damaged": 0, "red": 0},
                "medium": {"green": 0, "damaged": 0, "red": 0},
                "large": {"green": 0, "damaged": 0, "red": 0},
            },
        }

        
        raw_detections = []
        for box in boxes:
            conf = float(box.conf.cpu().numpy()[0])
            if conf < CONF_THRESHOLD:
                continue

            cls_id = int(box.cls.cpu().numpy()[0])
            class_name = model.names[cls_id]
            xyxy = box.xyxy.cpu().numpy()[0].tolist()

            label, color, size = parse_class_name(class_name)

            # Update counters safely
            if label in counter_data:
                if color in counter_data[label]["total"]:
                    counter_data[label]["total"][color] += 1
                if size in counter_data[label] and color in counter_data[label][size]:
                    counter_data[label][size][color] += 1
                    
            raw_detections.append({
                "bbox": xyxy,
                "class": class_name,
                "confidence": conf,
                "label": label,
                "color": color,
                "size": size
            })


        filtered = []
        raw_detections.sort(key=lambda x: x["confidence"], reverse=True)

        for det in raw_detections:
            keep = True
            for f in filtered:
                if iou(det["bbox"], f["bbox"]) > IOU_THRESHOLD:
                    keep = False
                    break
            if keep:
                filtered.append(det)

        height, width = img.shape[:2]
        emit('detections', {
            'detections': [
                {**d, "confidence": round(d["confidence"], 3)}
                for d in filtered
            ],
            'counters': counter_data,
            'image_size': {'width': width, 'height': height}
            
        })

        print(f"✅ Frame processed in {time.time() - start_time:.2f}s — {len(filtered)} detections")

    except Exception as e:
        print('❌ Error processing frame:', e)
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
    