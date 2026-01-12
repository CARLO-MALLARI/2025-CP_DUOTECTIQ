from flask import Flask, request
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2, base64, numpy as np, time
import torch

app = Flask(__name__)
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet"
)


device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO("best.pt").to(device)

print("🔥 Using device:", device)
print("✅ Model loaded successfully with classes:", model.names)

CONF_THRESHOLD = 0.7 
IOU_THRESHOLD = 0.6

# Store counters and seen track IDs per client session
session_counters = {}
session_seen_tracks = {}

def create_empty_counter():
    return {
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

def summarize_counters(counter_data):
    summary = []
    for crop, data in counter_data.items():
        total = data["total"]

        for size in ["small", "medium", "large"]:
            for color in ["green", "red"]:
                amount = data[size][color]
                if amount > 0:
                    summary.append({
                        "crop": crop,
                        "type": size,
                        "color": color.capitalize(),
                        "status": "Good",
                        "amount": amount
                    })

        # Damaged items (size-independent)
        if data["total"]["damaged"] > 0:
            summary.append({
                "crop": crop,
                "type": "Damaged",
                "color": "Unknown",
                "status": "Damaged",
                "amount": data["total"]["damaged"]
            })
    return summary


def parse_class_name(class_name: str):
    """
    New simplified parser for the new 14-class system
    Returns: crop, color, size, is_damaged
    """
    name = class_name.lower()

    is_damaged = "damaged" in name
    is_tomato = "tomato" in name

    crop = "Tomato" if is_tomato else "Bellpepper"

    if is_damaged:
        return crop, "damaged", "unknown", True

    # Color
    if "red" in name:
        color = "red"
    elif "green" in name:
        color = "green"
    else:
        color = "unknown"

    # Size
    if "small" in name:
        size = "small"
    elif "medium" in name:
        size = "medium"
    elif "large" in name:
        size = "large"
    else:
        size = "unknown"

    return crop, color, size, is_damaged


@app.route('/')
def index():
    return "✅ Flask YOLO WebSocket Server is running!"

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    session_counters[sid] = create_empty_counter()
    session_seen_tracks[sid] = set() 
    print(f"📡 Client connected: {sid}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in session_counters:
        final_data = session_counters.pop(sid)
        print(f"📤 Final counter for {sid}: {final_data}")
    if sid in session_seen_tracks:
        session_seen_tracks.pop(sid)
    print(f"❌ Client disconnected: {sid}")

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
    sid = request.sid
    start_time = time.time()

    try:
        if ',' in data:
            img_data = base64.b64decode(data.split(',')[1])
        else:
            img_data = base64.b64decode(data)
        img_array = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            emit('error', {'message': 'Invalid image data'})
            return

        # Use track() instead of predict()
        results = model.track(
            img,
            persist=True,
            tracker="bytetrack.yaml",
            conf=CONF_THRESHOLD,
            verbose=False
        )

        boxes = results[0].boxes

        counter = session_counters.setdefault(sid, create_empty_counter())
        seen = session_seen_tracks.setdefault(sid, set())

        current_frame_detections = []

        for box in boxes:
            conf = float(box.conf)
            if conf < CONF_THRESHOLD:
                continue

            cls_id = int(box.cls)
            class_name = model.names[cls_id]

            crop, color, size, is_damaged = parse_class_name(class_name)

            track_id = None
            if box.id is not None:
                track_id = int(box.id)

            detection = {
                "bbox": box.xyxy.tolist()[0],
                "class": class_name,
                "confidence": round(conf, 3),
                "track_id": track_id,
                "crop": crop,
                "color": color.capitalize() if color != "damaged" else "Unknown",
                "size": size.capitalize() if size != "unknown" else None,
                "status": "Damaged" if is_damaged else "Good",
                "is_new": track_id is not None and track_id not in seen
            }

            current_frame_detections.append(detection)

            # Count only new unique objects
            if detection["is_new"] and track_id is not None:
                if crop in counter:
                    # Total by color/status
                    if is_damaged:
                        counter[crop]["total"]["damaged"] += 1
                    else:
                        counter[crop]["total"][color] += 1

                    # By size (only good ones)
                    if not is_damaged and size != "unknown":
                        if size in counter[crop]:
                            counter[crop][size][color] += 1

                seen.add(track_id)

        # Very simple NMS if you still want it (usually not necessary with good tracker)
        # You can also just skip it completely now
        final_detections = current_frame_detections  # ← or do light NMS if needed

        summary = summarize_counters(counter)

        height, width = img.shape[:2]

        emit('detections', {
            'detections': final_detections,
            'counters': counter,
            'summary': summary,
            'image_size': {'width': width, 'height': height},
            'unique_objects': len(seen)
        })

        print(f"Frame: {len(final_detections)} dets, {len(seen)} unique | {time.time()-start:.3f}s")

    except Exception as e:
        print("Error:", e)
        emit('error', {'message': str(e)})

@socketio.on('reset_counters')
def handle_reset():
    """Allow clients to reset their counters"""
    sid = request.sid
    session_counters[sid] = create_empty_counter()
    session_seen_tracks[sid] = set()
    emit('counters_reset', {'message': 'Counters reset successfully'})
    print(f"🔄 Counters reset for session {sid}")

if __name__ == '__main__':
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=False,
        allow_unsafe_werkzeug=True,
        log_output=True
    )