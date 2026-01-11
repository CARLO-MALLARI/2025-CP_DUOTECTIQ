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
model = YOLO("yolov8.pt").to(device)

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
    """Parse class name into hierarchical attributes"""
    parts = class_name.lower().split('_')
    
    # Determine crop type
    label = 'Tomato' if 'tomato' in parts else 'Bellpepper' if 'bellpepper' in parts or 'pepper' in parts else 'Unknown'
    
    # Determine damage status first (highest priority)
    is_damaged = 'damaged' in parts or 'damage' in parts
    
    # Determine color
    if is_damaged:
        color = 'damaged'
    elif 'red' in parts:
        color = 'red'
    elif 'green' in parts:
        color = 'green'
    else:
        color = 'unknown'
    
    # Determine size from class name
    if 'small' in parts:
        size = 'small'
    elif 'medium' in parts:
        size = 'medium'
    elif 'large' in parts:
        size = 'large'
    else:
        size = 'unknown'  # For generic classes like "tomato_green"
    
    return label, color, size, is_damaged


def estimate_size_from_bbox(bbox, image_width, image_height, crop_type):
    """
    TEMPORARY WORKAROUND: Estimate size from bounding box dimensions.
    This is NOT as accurate as a trained model but works until you retrain.
    
    Args:
        bbox: [x1, y1, x2, y2] in pixels
        image_width: Width of input image
        image_height: Height of input image
        crop_type: 'Tomato' or 'Bellpepper'
    
    Returns:
        'small', 'medium', or 'large'
    """
    x1, y1, x2, y2 = bbox
    
    # Calculate bbox area as percentage of image
    bbox_width = x2 - x1
    bbox_height = y2 - y1
    bbox_area = bbox_width * bbox_height
    image_area = image_width * image_height
    area_percentage = (bbox_area / image_area) * 100
    
    # Also consider aspect ratio and longest dimension
    aspect_ratio = bbox_width / bbox_height if bbox_height > 0 else 1
    max_dimension = max(bbox_width, bbox_height)
    max_dim_percentage = (max_dimension / max(image_width, image_height)) * 100
    
    # Size thresholds (adjust these based on your camera setup and distance)
    # These are ROUGH estimates - you'll need to tune them for your setup
    
    if crop_type == 'Tomato':
        # Tomatoes are typically round/spherical
        if area_percentage < 2.0 or max_dim_percentage < 10:
            return 'small'
        elif area_percentage < 6.0 or max_dim_percentage < 18:
            return 'medium'
        else:
            return 'large'
    
    elif crop_type == 'Bellpepper':
        # Bell peppers are typically elongated
        if area_percentage < 3.0 or max_dim_percentage < 12:
            return 'small'
        elif area_percentage < 8.0 or max_dim_percentage < 20:
            return 'medium'
        else:
            return 'large'
    
    # Default fallback
    if area_percentage < 3.0:
        return 'small'
    elif area_percentage < 7.0:
        return 'medium'
    else:
        return 'large'


def resolve_conflicts(detections, iou_threshold=0.7, specificity_bonus=0.15):
    """
    Resolve conflicting detections of the same object with different attributes.
    Prioritizes more specific detections (with size info) over generic ones.
    
    Args:
        specificity_bonus: Confidence boost for detections with size info (default: 0.15)
                          This makes "tomato_red_small" (0.60) effectively compete 
                          with "tomato_red" (0.70) as 0.60 + 0.15 = 0.75
    """
    if not detections:
        return []
    
    # Group overlapping detections
    groups = []
    used = set()
    
    for i, det in enumerate(detections):
        if i in used:
            continue
        
        group = [det]
        used.add(i)
        
        for j, other in enumerate(detections):
            if j <= i or j in used:
                continue
            
            if iou(det["bbox"], other["bbox"]) > iou_threshold:
                group.append(other)
                used.add(j)
        
        groups.append(group)
    
    # Resolve each group
    resolved = []
    for group in groups:
        if len(group) == 1:
            resolved.append(group[0])
            continue
        
        # PRIORITY LOGIC: More specific > Less specific
        # Apply specificity bonus to prefer detections with size information
        
        # Calculate effective confidence (actual + bonus for specificity)
        for det in group:
            det["effective_confidence"] = det["confidence"]
            if det["size"] != "unknown":
                det["effective_confidence"] += specificity_bonus
        
        # Sort by effective confidence
        group.sort(key=lambda x: x["effective_confidence"], reverse=True)
        
        # Take the highest effective confidence detection
        best = group[0].copy()
        
        # Debug logging for conflicts
        if len(group) > 1:
            print(f"  🔀 Merging {len(group)} detections for same object:")
            for d in group:
                marker = "✅" if d == group[0] else "  "
                print(f"    {marker} {d['class']:30s} conf={d['confidence']:.3f} eff={d['effective_confidence']:.3f} size={d['size']}")
        
        # Apply hierarchical logic across ALL detections in group
        
        # 1. If ANY detection shows damage, it's damaged
        if any(d["is_damaged"] for d in group):
            best["is_damaged"] = True
            best["color"] = "damaged"
        
        # 2. If best detection doesn't have size, try to get it from others
        if best["size"] == "unknown":
            sizes_with_conf = [(d["size"], d["effective_confidence"]) for d in group if d["size"] != "unknown"]
            if sizes_with_conf:
                best["size"] = max(sizes_with_conf, key=lambda x: x[1])[0]
                print(f"    ⚡ Inherited size '{best['size']}' from overlapping detection")
        
        # 3. Aggregate color info if not damaged (take most confident)
        if not best["is_damaged"]:
            colors = [(d["color"], d["effective_confidence"]) for d in group if d["color"] not in ["unknown", "damaged"]]
            if colors:
                potential_color = max(colors, key=lambda x: x[1])[0]
                if potential_color != best["color"]:
                    print(f"    ⚡ Color override: {best['color']} → {potential_color}")
                    best["color"] = potential_color
        
        # 4. Keep the bbox and actual confidence from the best detection
        best["bbox"] = best["bbox"]
        best["confidence"] = best["confidence"]  # Use REAL confidence, not effective
        
        # 5. Update class name to reflect resolved attributes
        if best["is_damaged"]:
            best["class"] = f"{best['label'].lower()}_{best['color']}_damaged"
        elif best["size"] != "unknown":
            best["class"] = f"{best['label'].lower()}_{best['color']}_{best['size']}"
        else:
            best["class"] = f"{best['label'].lower()}_{best['color']}"
        
        # Clean up temporary field
        del best["effective_confidence"]
        
        resolved.append(best)
    
    return resolved


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
                tid = box.id.cpu().numpy()
                if tid.size > 0:
                    track_id = int(tid[0])

            label, color, size, is_damaged = parse_class_name(class_name)
            
            # WORKAROUND: If size is unknown, estimate from bbox dimensions
            if size == 'unknown' and not is_damaged:
                height, width = img.shape[:2]
                size = estimate_size_from_bbox(xyxy, width, height, label)
            
            raw_detections.append({
                "bbox": xyxy,
                "class": class_name,
                "confidence": conf,
                "label": label,
                "color": color,
                "size": size,
                "is_damaged": is_damaged,
                "track_id": track_id
            })

        # Resolve conflicts (same object detected multiple times with different attributes)
        resolved_detections = resolve_conflicts(raw_detections, iou_threshold=0.7)
        
        # Debug: Log conflict resolution
        if len(raw_detections) > len(resolved_detections):
            print(f"🔧 Resolved {len(raw_detections)} detections → {len(resolved_detections)} (merged duplicates)")
            # Show what was merged
            for det in resolved_detections:
                print(f"   ✓ {det['class']} (conf: {det['confidence']:.3f}, size: {det['size']})")


        # Update counters only for new tracks
        for det in resolved_detections:
            track_id = det.get("track_id")
            is_new = track_id is not None and track_id not in seen_tracks
            det["is_new"] = is_new
            
            if is_new:
                label = det["label"]
                color = det["color"]
                size = det["size"]
                
                if label in counter_data:
                    if color in counter_data[label]["total"]:
                        counter_data[label]["total"][color] += 1
                    if size in counter_data[label] and color in counter_data[label][size]:
                        counter_data[label][size][color] += 1
                
                seen_tracks.add(track_id)

        session_counters[sid] = counter_data
        session_seen_tracks[sid] = seen_tracks

        # Final NMS filtering
        filtered = []
        resolved_detections.sort(key=lambda x: x["confidence"], reverse=True)
        for det in resolved_detections:
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
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=False,
        allow_unsafe_werkzeug=True
    )