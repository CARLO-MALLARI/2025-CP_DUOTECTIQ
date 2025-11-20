from flask import Flask, request
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2, base64, numpy as np, time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

model = YOLO("best.pt")
print("✅ Model loaded successfully with classes:", model.names)

CONF_THRESHOLD = 0.85
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

        if total["green"] > 0:
            summary.append({
                "crop": crop,
                "type": crop,
                "color": "Green",
                "status": "Good",
                "amount": total["green"]
            })
        if total["red"] > 0:
            summary.append({
                "crop": crop,
                "type": crop,
                "color": "Red",
                "status": "Good",
                "amount": total["red"]
            })
        if total["damaged"] > 0:
            summary.append({
                "crop": crop,
                "type": crop,
                "color": "Unknown",
                "status": "Damaged",
                "amount": total["damaged"]
            })
    return summary


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
        img_data = base64.b64decode(data.split(',')[1])
        img_array = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            emit('error', {'message': 'Invalid image data'})
            return

        # Use track() instead of predict() - this maintains object IDs across frames
        # tracker options: 'botsort.yaml' or 'bytetrack.yaml'
        results = model.track(
            img, 
            persist=True,  # Persist tracks between frames
            tracker='bytetrack.yaml',
            conf=CONF_THRESHOLD,
            verbose=False
        )
        
        boxes = results[0].boxes

        counter_data = session_counters.get(sid, create_empty_counter())
        seen_tracks = session_seen_tracks.get(sid, set())

        raw_detections = []
        for box in boxes:
            conf = float(box.conf.cpu().numpy()[0])
            if conf < CONF_THRESHOLD:
                continue

            cls_id = int(box.cls.cpu().numpy()[0])
            class_name = model.names[cls_id]
            xyxy = box.xyxy.cpu().numpy()[0].tolist()
            
            track_id = None
            if box.id is not None:
                track_id = int(box.id.cpu().numpy()[0])

            label, color, size = parse_class_name(class_name)
            is_new = track_id is not None and track_id not in seen_tracks
            
            if is_new:
                if label in counter_data:
                    if color in counter_data[label]["total"]:
                        counter_data[label]["total"][color] += 1
                    if size in counter_data[label] and color in counter_data[label][size]:
                        counter_data[label][size][color] += 1
                
                seen_tracks.add(track_id)

            raw_detections.append({
                "bbox": xyxy,
                "class": class_name,
                "confidence": conf,
                "label": label,
                "color": color,
                "size": size,
                "track_id": track_id,
                "is_new": is_new
            })

        session_counters[sid] = counter_data
        session_seen_tracks[sid] = seen_tracks

        # NMS filtering (though tracking already handles most duplicates)
        filtered = []
        raw_detections.sort(key=lambda x: x["confidence"], reverse=True)
        for det in raw_detections:
            if not any(iou(det["bbox"], f["bbox"]) > IOU_THRESHOLD for f in filtered):
                filtered.append(det)
        
        summary = summarize_counters(counter_data)
        height, width = img.shape[:2]
        emit('detections', {
            'detections': [{**d, "confidence": round(d["confidence"], 3)} for d in filtered],
            'counters': counter_data,
            'summary': summary,
            'image_size': {'width': width, 'height': height},
            'unique_objects': len(seen_tracks)
        })

        print(f"✅ Frame processed in {time.time() - start_time:.2f}s — {len(filtered)} detections, {len(seen_tracks)} unique objects (session {sid})")

    except Exception as e:
        print('❌ Error processing frame:', e)
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
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)