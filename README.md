# 🧠 DUOTECTIQ v2 System

A full-stack project combining a **Python Flask backend** and a **React Native mobile client**, built for modular, scalable development and local testing using a virtual environment (`venv`).

---

## 🚀 Overview

This project is composed of two main parts:

| Layer | Framework | Description |
|--------|-------------|-------------|
| **Backend (API Server)** | Flask (Python) | Handles RESTful API requests, data logic, and server-side processing. |
| **Client (Mobile App)** | React Native | Provides an interactive, cross-platform mobile interface connected to the Flask API. |
---

## ⚙️ Backend Setup (Flask + venv)

### 1️⃣ Navigate to the backend folder
```bash
cd backend
```

### 2️⃣ Create and activate a virtual environment

#### Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

### 3️⃣ Install dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Run the Flask server
```bash
python app.py
```

By default, Flask runs on:
```
http://127.0.0.1:5000/
```

---

## 📱 Client Setup (React Native)

### 1️⃣ Navigate to the client folder
```bash
cd MainClient
```

### 2️⃣ Install dependencies
```bash
npm install
```
or
```bash
yarn install
```

### 3️⃣ Start Metro bundler
```bash
npx react-native start
```

### 4️⃣ Run the app on emulator or device

#### Android:
```bash
npx react-native run-android
```

Once running, Metro will serve the JavaScript bundle (by default at `http://localhost:8081`).

---

## 🔗 Connecting Flask and React Native

To link the mobile client with your local Flask server:

1. Ensure both are running on the same network.
2. Update your API base URL in your React Native app (e.g. `src/config/api.js`):

```js
export const API_URL = "http://<your-local-ip>:5000";
```

To find your local IP:
```bash
ipconfig     # Windows
```

---

## 🧰 Common Commands

### Backend
| Action | Command |
|--------|----------|
| Install requirements | `pip install -r requirements.txt` |
| Freeze dependencies | `pip freeze > requirements.txt` |
| Run Flask server | `python app.py` |
| Activate venv | `venv\Scripts\activate` (Win) |

### Client
| Action | Command |
|--------|----------|
| Start Metro | `npx react-native start` |
| Run Android | `npx react-native run-android` |
| Build release | `npx react-native build` |

---
---

## 🧪 Development Notes

- Always activate your `venv` before running Flask.
- React Native Metro runs on port `8081`; Flask runs on port `5000`.
- Ensure `CORS` is enabled on your Flask backend to allow React Native requests:
  ```python
  from flask_cors import CORS
  CORS(app)
  ```

---

## 🧩 Versions

| Component | Version |
|------------|----------|
| **Python** | 3.12+ |
| **Flask** | 3.0.x |
| **React Native** | 0.76.x |
| **Node.js** | 20+ |
| **npm / yarn** | npm 10+ / yarn 4+ |

---
