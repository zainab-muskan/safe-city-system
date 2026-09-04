# 🏙️ Safe City AI: Automatic License Plate Recognition System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-FastAPI-3776AB?logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-React-000000?logo=nextdotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)

A full-stack, microservices-based Automatic License Plate Recognition (ALPR) platform designed for modern law enforcement and city command centers. 

This system uses cutting-edge Computer Vision to detect and read license plates from live camera feeds in real-time, cross-references them against a central database, and instantly dispatches alerts for stolen or unregistered vehicles to field officers.

---
SUPER ADMIN:
<img width="1807" height="902" alt="Login Screen" src="https://github.com/user-attachments/assets/fbc96128-34cb-41a9-9391-c28f77ad0555" />

<img width="1915" height="963" alt="Dashboard" src="https://github.com/user-attachments/assets/35399d96-1153-405b-8ac0-537c566246db" />
📸 Super Admin Command Center: Built with secure Role-Based Access Control (RBAC) using JWTs. Super Admins can manage the entire surveillance infrastructure, generate automated PDF Security Briefings, and assign field officers to physical checkpoints.

<img width="1473" height="967" alt="Live Alerts" src="https://github.com/user-attachments/assets/c28ca518-4f65-4f14-a3ad-e371f9fa243e" />
📸 Live Threat Triage: AI detections are instantly fed to this central dashboard. Features a custom Anti-Spam/Debounce algorithm in the Node.js backend to prevent duplicate alerts if a flagged car is sitting at a red light. Operators can review the AI's confidence, instantly correct OCR typos, and dispatch the alert to field officers.

<img width="1898" height="927" alt="VEHICLES" src="https://github.com/user-attachments/assets/68d364fa-3126-4e1c-8b17-921f5e93f0bb" />
📸 Central Vehicle Registry: A full CRUD interface for managing the city's registered vehicles. Admins can update legal statuses (e.g., flagging a car as 'Stolen'), which instantly updates the cross-reference matching logic used by the real-time AI pipeline.

<img width="1892" height="932" alt="CHECKPOINTS" src="https://github.com/user-attachments/assets/ca8f0b0c-a420-4479-b660-f4ebeef81e7e" />
📸 Tactical Checkpoint Management: Admins can define physical security checkpoints using interactive map coordinates. Includes a dynamic assignment system that automatically dispatches simulated SMS alerts to Checkpoint Officers when they are deployed to a new location.

<img width="1900" height="902" alt="CAMERA" src="https://github.com/user-attachments/assets/e8c1aa5a-ea40-45e4-85d0-cfaddd0d0e66" />
📸 Surveillance Grid Setup: Interface for registering new IP/CCTV cameras into the network. Cameras are tied to specific GPS coordinates, allowing the Node.js backend to accurately plot AI threat detections on the Live City Map.

<img width="1915" height="930" alt="USERS" src="https://github.com/user-attachments/assets/8b96c38f-299f-4316-99fc-ec7ec44e7029" />
📸 Staff & Access Control: Comprehensive User management system built on JWT (JSON Web Tokens) and RBAC (Role-Based Access Control). Admins can securely provision accounts for Command Center Operators and Field Officers with strictly segregated database permissions.


OPERATOR:

<img width="1607" height="928" alt="Live Alerts Operator side" src="https://github.com/user-attachments/assets/9dacaf03-b1a5-451d-902e-e3074607bd82" />
📸 Command Center Triage (Operator): Real-time feed of AI threat detections. Features a custom Anti-Spam/Debounce algorithm to prevent duplicate alerts. Operators can review the AI's snapshot, instantly correct OCR typos, and dispatch verified threats directly to field units.


OFFICER:

<img width="1908" height="932" alt="Incoming Checkpoint ALerts" src="https://github.com/user-attachments/assets/3071c286-305b-4fff-a00f-8128d7848b12" />
📸 Mobile Dispatch Queue (Field Officer): A mobile-optimized interface for officers stationed at physical checkpoints. Officers receive instantly dispatched threats from the Command Center, complete with suspect vehicle photos, registry details, and status resolution controls (e.g., marking a threat as 'Resolved').

<img width="1910" height="825" alt="Plate Scanner" src="https://github.com/user-attachments/assets/7eb853f0-5ce9-48a1-9ce2-f2d609edd312" />
📸 Tactical Plate Scanner (Field Officer): A real-time manual fallback tool. Allows field officers to type and query a suspicious license plate against the central Node.js backend registry on the go, instantly retrieving owner details and generating a manual threat alert if the vehicle is flagged.




## ✨ Key Features


- **🧠 Real-Time AI Pipeline:** Utilizes **YOLOv8** for rapid vehicle detection and **EasyOCR** for extracting license plate text from live webcam or RTSP streams.
- **🗺️ Live Command Center Map:** Interactive Leaflet.js map tracking all active cameras, checkpoints, and plotting live threats in real-time.
- **🛡️ Anti-Spam / Debounce Logic:** Smart backend algorithms prevent the system from flooding operators with duplicate alerts when a flagged car sits at a red light.
- **📱 Checkpoint Officer App:** Mobile-friendly view for field officers to receive dispatches and manually scan plates.
- **📸 Public Citizen Portal:** A public-facing web app allowing citizens to upload photos and drop map pins to report suspicious vehicles directly to the command center.
- **📊 PDF Security Briefings:** Automated generation of daily statistical reports and incident logs using jsPDF.

---

## 🏗️ System Architecture

The project is broken down into three decoupled microservices to ensure scalability:

```mermaid
graph TD
    A[Live Camera Feed] -->|Frames| B(Python / FastAPI AI Core)
    B -->|YOLOv8 + EasyOCR| B
    B -->|Base64 Crop & Plate Text| C(Node.js / Express Backend)
    
    E[Public Citizen Portal] -->|Photo & Location| C
    
    C <-->|Query & Auth| D[(MongoDB)]
    
    C -->|REST API| F[Next.js Command Center]
    F -->|Super Admin| G[Infrastructure & PDF Reports]
    F -->|Operator| H[Live Map & Threat Verification]
    F -->|Checkpoint Officer| I[Mobile Dispatch & Scanner]
```

---

## 💻 Tech Stack

### AI Core (Computer Vision)
- **Python 3**
- **YOLOv8 (Ultralytics):** Vehicle bounding box detection
- **EasyOCR:** Optical Character Recognition
- **FastAPI:** Exposing the AI as a local microservice
- **OpenCV:** Frame extraction and image processing

### Backend (API & Database)
- **Node.js & Express.js**
- **MongoDB & Mongoose:** Data persistence and geospatial queries
- **JSON Web Tokens (JWT):** Role-based access control (Admin, Operator, Officer)

### Frontend (UI/UX)
- **Next.js & React**
- **Tailwind CSS:** Responsive, dark-mode command center styling
- **Leaflet.js & React-Leaflet:** Interactive city mapping
- **jsPDF & AutoTable:** Client-side PDF generation

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB running locally or via MongoDB Atlas

### 1. Database Setup & Seeding
```bash
cd backend
npm install
# Rename .env.example to .env and add your MONGO_URI
node seed.js  # Seeds admin users, cameras, and mock vehicle registry
node server.js # Starts the backend on port 5000
```

### 2. AI Core Setup
```bash
cd ai-core
python -m venv venv
# Activate venv (Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
uvicorn main:app --reload # Starts FastAPI on port 8000
```
*In a separate terminal, start the camera streamer:*
```bash
python rtsp_stream.py 0 # 0 for laptop webcam, or provide an RTSP URL
```

### 3. Frontend Setup
```bash
cd safecity-frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev # Starts the dashboard on port 3000
```

---

## 👤 Default Test Credentials
- **Super Admin:** `admin@safecity.pk` | `Admin@123`
- **Operator:** `operator1@safecity.pk` | `Operator@123`
- **Checkpoint Officer:** `officer1@safecity.pk` | `Officer@123`

---
*Built as a portfolio project to demonstrate microservices architecture, full-stack web development, and applied computer vision.*
