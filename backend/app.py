from flask import Flask, request
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2, base64, numpy as np
import torch
from collections import defaultdict
import uuid

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO("v8new.pt").to(device)

print("🔥 Using device:", device)
print("✅ Model loaded successfully with classes:", model.names)

CONF_THRESHOLD = 0.8
IOU_THRESHOLD = 0.2
MAX_FRAMES_LOST = 1  

# ─── Pixel-based size thresholds (bounding box area in px²) ───────────────────
# Tuned for 640×640 model input. Adjust these to fit your use case.
SIZE_SMALL_MAX  =  4_000   # area <= this → small   (≈ up to ~63×63)
SIZE_MEDIUM_MAX = 14_000   # area <= this → medium  (≈ up to ~118×118)
                            # area >  this → large
# ─────────────────────────────────────────────────────────────────────────────

def classify_size_from_bbox(bbox):
    """
    Classify object size based on bounding box pixel area.
    bbox: [x_min, y_min, x_max, y_max]
    Returns: 'small' | 'medium' | 'large'
    """
    x_min, y_min, x_max, y_max = bbox
    area = (x_max - x_min) * (y_max - y_min)

    if area <= SIZE_SMALL_MAX:
        return "small"
    elif area <= SIZE_MEDIUM_MAX:
        return "medium"
    else:
        return "large"

session_counters = {}
session_tracked_objects = {}

def calculate_iou(box1, box2):
    """Calculate Intersection over Union between two bounding boxes"""
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    
    inter_x_min = max(x1_min, x2_min)
    inter_y_min = max(y1_min, y2_min)
    inter_x_max = min(x1_max, x2_max)
    inter_y_max = min(y1_max, y2_max)
    
    if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
        return 0.0
    
    inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
    
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - inter_area
    
    return inter_area / union_area if union_area > 0 else 0.0

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
    """
    Parse the 6 new classes:
      bellpepper_green, bellpepper_red, bellpepper_damaged
      tomato_green,     tomato_red,     tomato_damaged

    Size is NO LONGER derived from the class name — it is calculated
    from bounding box pixels via classify_size_from_bbox().

    Returns: (crop, color, is_damaged)
    """
    name = class_name.lower()
    is_damaged = "damaged" in name
    is_tomato  = "tomato" in name

    crop  = "Tomato" if is_tomato else "Bellpepper"
    color = "red" if "red" in name else "green" if "green" in name else "unknown"

    return crop, color, is_damaged


class TrackedObject:
    def __init__(self, object_id, bbox, class_name, confidence, crop, color, size, is_damaged):
        self.id = object_id
        self.bbox = bbox
        self.class_name = class_name
        self.initial_confidence = confidence
        self.crop = crop
        self.color = color
        self.size = size          # dynamically updated each frame
        self.is_damaged = is_damaged
        self.frames_lost = 0
        self.counted = False
    
    def update(self, bbox):
        """Update position and recalculate size when re-detected"""
        self.bbox = bbox
        self.size = classify_size_from_bbox(bbox)   # ← live size update
        self.frames_lost = 0
    
    def mark_lost(self):
        self.frames_lost += 1
    
    def is_lost(self, max_frames):
        return self.frames_lost > max_frames


def match_detections_to_tracked(detections, tracked_objects, iou_threshold):
    """Match current detections to tracked objects using IoU"""
    matched = {}
    unmatched_detections = []
    
    for det_idx, det in enumerate(detections):
        best_iou = 0
        best_track_id = None
        
        for track_id, tracked in tracked_objects.items():
            iou = calculate_iou(det['bbox'], tracked.bbox)
            if iou > best_iou and iou > iou_threshold:
                best_iou = iou
                best_track_id = track_id
        
        if best_track_id:
            matched[det_idx] = best_track_id
        else:
            unmatched_detections.append(det_idx)
    
    return matched, unmatched_detections


@app.route('/')
def index():
    return "✅ Flask YOLO WebSocket Server is running!"

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    session_counters[sid] = create_empty_counter()
    session_tracked_objects[sid] = {}
    print(f"📡 Client connected: {sid}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in session_counters:
        session_counters.pop(sid)
    if sid in session_tracked_objects:
        session_tracked_objects.pop(sid)
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
        
        results = model.predict(img, conf=CONF_THRESHOLD, verbose=False)
        boxes = results[0].boxes
        
        # Parse detections — size now comes from bbox pixels
        current_detections = []
        for box in boxes:
            conf = float(box.conf)
            if conf < CONF_THRESHOLD:
                continue
            
            cls_id    = int(box.cls)
            class_name = model.names[cls_id]
            bbox       = box.xyxy.tolist()[0]

            crop, color, is_damaged = parse_class_name(class_name)
            size = classify_size_from_bbox(bbox)        # ← pixel-based size

            detection = {
                "bbox":       bbox,
                "class":      class_name,
                "confidence": conf,
                "crop":       crop,
                "color":      color,
                "size":       size,
                "is_damaged": is_damaged
            }
            current_detections.append(detection)
        
        tracked_objects = session_tracked_objects.setdefault(sid, {})
        
        matched, unmatched = match_detections_to_tracked(
            current_detections, tracked_objects, IOU_THRESHOLD
        )
        
        # Update matched objects (size is recalculated inside tracked.update())
        active_track_ids = set()
        for det_idx, track_id in matched.items():
            det = current_detections[det_idx]
            tracked_objects[track_id].update(det['bbox'])
            active_track_ids.add(track_id)
        
        # Create new tracked objects for unmatched detections
        for det_idx in unmatched:
            det = current_detections[det_idx]
            new_id = str(uuid.uuid4())[:8]
            
            tracked_objects[new_id] = TrackedObject(
                object_id  = new_id,
                bbox       = det['bbox'],
                class_name = det['class'],
                confidence = det['confidence'],
                crop       = det['crop'],
                color      = det['color'],
                size       = det['size'],          # already pixel-classified
                is_damaged = det['is_damaged']
            )
            active_track_ids.add(new_id)
            print(f"🆕 New object: {new_id} - {det['class']} [{det['size']}] @ {det['confidence']:.2f}")
        
        # Mark/remove lost objects
        to_remove = []
        for track_id, tracked in tracked_objects.items():
            if track_id not in active_track_ids:
                tracked.mark_lost()
                if tracked.is_lost(MAX_FRAMES_LOST):
                    to_remove.append(track_id)
                    print(f"🗑️ Removing lost object: {track_id}")
        
        for track_id in to_remove:
            del tracked_objects[track_id]
        
        # Build response — retains the same shape as before
        detections_with_tracking = []
        for track_id, tracked in tracked_objects.items():
            # Append pixel-derived size to the base class name
            # e.g. "bellpepper_green" → "bellpepper_green_small"
            sized_class = f"{tracked.class_name}_{tracked.size}" if not tracked.is_damaged else tracked.class_name
            detections_with_tracking.append({
                "id":         track_id,
                "bbox":       tracked.bbox,
                "class":      sized_class,
                "confidence": round(tracked.initial_confidence, 3),
                "crop":       tracked.crop,
                "color":      tracked.color.capitalize() if tracked.color != "unknown" else "Unknown",
                "size":       tracked.size.capitalize(),   # always small/medium/large
                "status":     "Damaged" if tracked.is_damaged else "Good",
                "counted":    tracked.counted,
                "frames_lost": tracked.frames_lost
            })
        
        counter = session_counters.setdefault(sid, create_empty_counter())
        summary = summarize_counters(counter)
        
        emit('detections', {
            'detections':    detections_with_tracking,
            'counters':      counter,
            'summary':       summary,
            'image_size':    {'width': 640, 'height': 640},
            'tracked_count': len(tracked_objects)
        })
    
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()
        emit('error', {'message': str(e)})


@socketio.on('manual_count')
def handle_manual_count(data):
    """Count specific detections manually by their tracking ID"""
    sid = request.sid
    detection_ids = data.get('detection_ids', [])
    
    counter         = session_counters.setdefault(sid, create_empty_counter())
    tracked_objects = session_tracked_objects.get(sid, {})
    
    print(f"➕ Manual count request for IDs: {detection_ids}")
    
    counted = 0
    for det_id in detection_ids:
        if det_id in tracked_objects:
            tracked = tracked_objects[det_id]
            
            if not tracked.counted:
                crop       = tracked.crop
                color      = tracked.color
                size       = tracked.size
                is_damaged = tracked.is_damaged
                
                if crop in counter:
                    if is_damaged:
                        counter[crop]["total"]["damaged"] += 1
                        print(f"  ✓ {crop} damaged +1 (ID: {det_id})")
                    else:
                        counter[crop]["total"][color] += 1
                        if size in counter[crop]:
                            counter[crop][size][color] += 1
                        print(f"  ✓ {crop} {size} {color} +1 (ID: {det_id})")
                    
                    tracked.counted = True
                    counted += 1
    
    summary = summarize_counters(counter)
    
    emit('count_updated', {
        'counters': counter,
        'summary':  summary,
        'message':  f'Counted {counted} new items'
    })
    print(f"✅ Manual count completed: {counted} items")


@socketio.on('reset_counters')
def handle_reset():
    sid = request.sid
    session_counters[sid]        = create_empty_counter()
    session_tracked_objects[sid] = {}
    emit('counters_reset', {'message': 'Counters and tracking reset successfully'})
    print(f"🔄 Counters and tracking reset for session {sid}")


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False,
                 allow_unsafe_werkzeug=True, log_output=True)