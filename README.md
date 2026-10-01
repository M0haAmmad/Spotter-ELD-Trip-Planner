# Trucking Trip & ELD (Electronic Logging Device) Planner

A modern, highly polished, and responsive full-stack web application for logistics, fleet management, trip planning, and Hours of Service (HOS) compliance tracking. Built with **React (Vite)**, **Tailwind CSS v4**, **Lucide React**, and **Django REST Framework**.

---

## 🚀 Features

- **Sleek Dark Dashboard UI:** Modern slate/emerald color palette tailored for logistics operations, complete with subtle micro-animations and glowing indicators.
- **Dynamic Real-Time Clock & Date:** Displays live real-world date and ticking clock.
- **Trip Configuration Form:** Inputs for *Current Location*, *Pickup Location*, *Dropoff Location*, and *Current Cycle Used (Hours)*.
- **Backend API Integration (`/api/calculate-trip/`):** Asynchronous POST request fetching calculated route metrics and duty logs.
- **Dynamic HOS Compliance Logic:**
  - Remaining cycle hours formula: $$\text{remaining\_hours} = 70 - (\text{cycle\_used} + \text{total\_on\_duty})$$
  - **Normal** ($> 15$ hours remaining): Green status indicator & badge.
  - **Warning** ($0 < \text{hours} \le 15$ remaining): Yellow/amber warning indicator.
  - **Action Req** ($\le 0$ hours remaining): Red alert indicator for 70-hour limit violations.
- **ELD Daily Log Sheets:** Visual 24-hour duty status timeline chart (Off Duty, Sleeper Berth, Driving, On Duty) paired with a structured breakdown table.
- **Interactive Route View:** Visual map path representation with waypoints for origin, rest/fuel stops, and destination.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS v4 & PostCSS
- **Icons:** Lucide React

### **Backend**
- **Framework:** Django 5.2 & Django REST Framework (DRF)
- **CORS Handling:** `django-cors-headers`

---

## 📂 Project Structure

```text
Spotter Project/
├── frontend/                     # React Frontend App
│   ├── src/
│   │   ├── App.jsx               # Main Dashboard Component & State Management
│   │   ├── index.css             # Tailwind CSS v4 Entry Point
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── spotter_project/              # Django Backend App
│   ├── core/
│   │   ├── views.py              # API Endpoint /api/calculate-trip/
│   │   ├── serializers.py
│   │   └── models.py
│   ├── spotter_project/
│   │   ├── settings.py           # Django Settings & CORS Config
│   │   └── urls.py               # Main URL Routing
│   └── manage.py
│
├── venv/                         # Python Virtual Environment
└── README.md
```

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+)

---

### 2. Backend Setup (Django)

1. Open your terminal in the project root:
   ```bash
   cd "Spotter Project"
   ```

2. Activate the Python virtual environment:
   - **PowerShell (Windows):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Bash/Mac/Linux:**
     ```bash
     source venv/bin/activate
     ```

3. Navigate to the Django app folder:
   ```bash
   cd spotter_project
   ```

4. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   The backend API will be running at `http://127.0.0.1:8000/`.

---

### 3. Frontend Setup (React / Vite)

1. Open a new terminal window in the project root and navigate to `frontend`:
   ```bash
   cd "Spotter Project/frontend"
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will open at `http://localhost:5173/` (or `http://localhost:5174/`).

---

## 📡 API Specification

### `POST /api/calculate-trip/`

#### **Request Body:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Nashville, TN",
  "current_cycle_used": 45
}
```

#### **Response Body:**
```json
{
  "status": "success",
  "trip_details": {
    "current_location": "Chicago, IL",
    "pickup_location": "Indianapolis, IN",
    "dropoff_location": "Nashville, TN",
    "cycle_used_hours": 45.0
  },
  "calculated_metrics": {
    "estimated_driving_hours": 8.5,
    "total_on_duty_hours": 10.5,
    "remaining_cycle_hours": 14.5,
    "compliance_level": "Warning",
    "compliance_status": "Warning: Cycle Limit Approaching"
  },
  "eld_logs": [
    {
      "duty_status": "Off Duty",
      "hours": 10.0,
      "location": "Chicago, IL",
      "remark": "10-hour mandatory rest"
    },
    {
      "duty_status": "On Duty (Not Driving)",
      "hours": 1.0,
      "location": "Indianapolis, IN",
      "remark": "Pre-trip inspection & Loading"
    },
    {
      "duty_status": "Driving",
      "hours": 8.5,
      "location": "En Route",
      "remark": "Driving to dropoff"
    },
    {
      "duty_status": "On Duty (Not Driving)",
      "hours": 1.0,
      "location": "Nashville, TN",
      "remark": "Unloading & Post-trip"
    }
  ]
}
```
