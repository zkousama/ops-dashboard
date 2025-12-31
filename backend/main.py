from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import numpy as np
from sklearn.ensemble import IsolationForest
import subprocess
import os

app = FastAPI()

# --- config ---
# allow next.js (port 3000) to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# if running in Docker, use the env var. if local, use localhost.
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")

# --- the AI brain ---
class MetricMonitor:
    def __init__(self):
        self.history = []
        self.model = IsolationForest(contamination=0.05)
        self.is_trained = False

    def add_data(self, cpu_val, mem_val):
        self.history.append([cpu_val, mem_val])
        if len(self.history) > 50:
            self.history.pop(0)
        
        if len(self.history) >= 10:
            self.train()

    def train(self):
        data_array = np.array(self.history)
        self.model.fit(data_array)
        self.is_trained = True

    def predict(self, cpu_val, mem_val):
        if not self.is_trained:
            return 1
        prediction = self.model.predict([[cpu_val, mem_val]])
        return prediction[0]

monitor = MetricMonitor()

def fetch_prometheus_data(query):
    try:
        response = requests.get(f"{PROMETHEUS_URL}/api/v1/query", params={'query': query})
        data = response.json()
        if data["status"] == "success" and data["data"]["result"]:
            return float(data["data"]["result"][0]["value"][1])
        return 0.0
    except Exception as e:
        print(f"Error fetching data: {e}")
        return 0.0

@app.get("/metrics")
def get_metrics():
    # 1. get real data
    cpu = fetch_prometheus_data('100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)')
    mem = fetch_prometheus_data('node_memory_MemAvailable_bytes') / 1073741824

    # 2. teach AI
    monitor.add_data(cpu, mem)

    # 3. predict
    prediction = monitor.predict(cpu, mem)
    status = "Normal" if prediction == 1 else "ANOMALY DETECTED"

    return {
        "cpu": round(cpu, 2),
        "memory_gb": round(mem, 2),
        "prediction": status,
        "trained": monitor.is_trained
    }

@app.get("/mitigate")
def mitigate_threat():
    try:
        # kill the 'yes' process
        subprocess.run(["pkill", "yes"], check=True)
        return {"status": "success", "message": "Threat neutralized."}
    except subprocess.CalledProcessError:
        return {"status": "error", "message": "No active threat found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
