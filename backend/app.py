from flask import Flask
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2, base64, numpy as np, time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

model = YOLO("best.pt")
print("✅ Model loaded successfully with classes:", model.names)

@app.route('/')
def index():
    return "✅ Flask YOLO WebSocket Server is running!"

@socketio.on('connect')
def handle_connect():
    print("📡 Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("❌ Client disconnected")

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

        # Run YOLO inference
        results = model.predict(img, verbose=False)
        boxes = results[0].boxes

        detections = []
        for box in boxes:
            cls_id = int(box.cls.cpu().numpy()[0])
            conf = float(box.conf.cpu().numpy()[0])
            xyxy = box.xyxy.cpu().numpy()[0].tolist()
            detections.append({
                "class": model.names[cls_id],
                "confidence": round(conf, 3),
                "bbox": xyxy
            })

        # Emit detections
        emit('detections', {'detections': detections})

        print(f"✅ Frame processed in {time.time() - start_time:.2f}s — {len(detections)} detections")

    except Exception as e:
        print('❌ Error processing frame:', e)
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
