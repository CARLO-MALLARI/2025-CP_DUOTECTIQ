from flask import Flask, request
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2, base64, numpy as np
import torch

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO("best.pt").to(device)

print("🔥 Using device:", device)
print("✅ Model loaded successfully with classes:", model.names)

CONF_THRESHOLD = 0.6

# Store counters per client session
session_counters = {}

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
    name = class_name.lower()
    is_damaged = "damaged" in name
    is_tomato = "tomato" in name
    
    crop = "Tomato" if is_tomato else "Bellpepper"
    
    if is_damaged:
        return crop, "damaged", "unknown", True
    
    color = "red" if "red" in name else "green" if "green" in name else "unknown"
    size = "small" if "small" in name else "medium" if "medium" in name else "large" if "large" in name else "unknown"
    
    return crop, color, size, is_damaged

@app.route('/')
def index():
    return "✅ Flask YOLO WebSocket Server is running!"

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    session_counters[sid] = create_empty_counter()
    print(f"📡 Client connected: {sid}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in session_counters:
        session_counters.pop(sid)
    print(f"❌ Client disconnected: {sid}")

@socketio.on('frame')
def handle_frame(data):
    sid = request.sid
    
    try:
        img_data = base64.b64decode(data.split(',')[1] if ',' in data else data)
        img_array = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            emit('error', {'message': 'Invalid image data'})
            return
        
        # Just detect, don't count
        results = model.predict(img, conf=CONF_THRESHOLD, verbose=False)
        boxes = results[0].boxes
        
        detections = []
        
        for box in boxes:
            conf = float(box.conf)
            if conf < CONF_THRESHOLD:
                continue
            
            cls_id = int(box.cls)
            class_name = model.names[cls_id]
            crop, color, size, is_damaged = parse_class_name(class_name)
            
            detection = {
                "bbox": box.xyxy.tolist()[0],
                "class": class_name,
                "confidence": round(conf, 3),
                "crop": crop,
                "color": color.capitalize() if color != "damaged" else "Unknown",
                "size": size.capitalize() if size != "unknown" else None,
                "status": "Damaged" if is_damaged else "Good"
            }
            detections.append(detection)
        
        # Get current counter (without incrementing)
        counter = session_counters.setdefault(sid, create_empty_counter())
        summary = summarize_counters(counter)
        
        emit('detections', {
            'detections': detections,
            'counters': counter,
            'summary': summary,
            'image_size': {'width': 640, 'height': 640}
        })
    
    except Exception as e:
        print("Error:", e)
        emit('error', {'message': str(e)})

@socketio.on('manual_count')
def handle_manual_count(data):
    """Count specific detections manually"""
    sid = request.sid
    detections_to_count = data.get('detections', [])
    
    counter = session_counters.setdefault(sid, create_empty_counter())
    
    print(f"➕ Manual count request for {len(detections_to_count)} detections")
    
    for det in detections_to_count:
        crop = det.get('crop')
        color = det.get('color', '').lower()
        size = det.get('size', '').lower() if det.get('size') else 'unknown'
        is_damaged = det.get('status') == 'Damaged'
        
        if crop in counter:
            if is_damaged:
                counter[crop]["total"]["damaged"] += 1
                print(f"  ✓ {crop} damaged +1")
            else:
                counter[crop]["total"][color] += 1
                if size != "unknown" and size in counter[crop]:
                    counter[crop][size][color] += 1
                print(f"  ✓ {crop} {size} {color} +1")
    
    summary = summarize_counters(counter)
    
    emit('count_updated', {
        'counters': counter,
        'summary': summary,
        'message': f'Counted {len(detections_to_count)} items'
    })
    print(f"✅ Manual count completed for session {sid}")

@socketio.on('reset_counters')
def handle_reset():
    sid = request.sid
    session_counters[sid] = create_empty_counter()
    emit('counters_reset', {'message': 'Counters reset successfully'})
    print(f"🔄 Counters reset for session {sid}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, 
                 allow_unsafe_werkzeug=True, log_output=True)