from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import requests
import numpy as np
from sklearn.ensemble import IsolationForest
import subprocess
import os
import joblib

app = FastAPI()

# --- security config ---
# this secret key must match what is in docker-compose.yml
API_KEY = os.getenv("API_SECRET", "default-insecure-secret")
# we save the brain to a folder mapped to a docker volume
MODEL_PATH = "/app/data/model.pkl"

# allow next.js (port 3000) to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# if running in docker, use the internal dns name.
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")

# --- security dependency ---
# this function acts as a bouncer. if the key is wrong, it blocks the request.
async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")
    return x_api_key

# --- the ai brain (persistent) ---
class MetricMonitor:
    def __init__(self):
        self.history = []
        self.model = None
        self.is_trained = False
        self.load_model()

    def load_model(self):
        # check if we have a saved brain from a previous run
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.is_trained = True
                print("✅ loaded existing ai model.")
            except Exception as e:
                print(f"⚠️ failed to load model: {e}")
                # if load fails, start fresh
                self.model = IsolationForest(contamination=0.05)
        else:
            print("🆕 no existing model found. starting fresh.")
            self.model = IsolationForest(contamination=0.05)

    def save_model(self):
        # make sure the folder exists before saving
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        print("💾 ai model saved to disk.")

    def add_data(self, cpu_val, mem_val):
        self.history.append([cpu_val, mem_val])
        # keep 1 minute of history in ram
        if len(self.history) > 60:
            self.history.pop(0)
        
        # auto-train every 20 data points (approx 40 seconds)
        if len(self.history) >= 20 and len(self.history) % 20 == 0:
            self.train()

    def train(self):
        data_array = np.array(self.history)
        self.model.fit(data_array)
        self.is_trained = True
        # save immediately after learning something new
        self.save_model()

    def predict(self, cpu_val, mem_val):
        # assume normal if we haven't learned anything yet
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
    except Exception:
        return 0.0

@app.get("/metrics")
def get_metrics():
    # 1. get real data from prometheus
    cpu = fetch_prometheus_data('100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)')
    mem = fetch_prometheus_data('node_memory_MemAvailable_bytes') / 1073741824

    # 2. feed the brain
    monitor.add_data(cpu, mem)

    # 3. ask for a prediction
    prediction = monitor.predict(cpu, mem)
    status = "Normal" if prediction == 1 else "ANOMALY DETECTED"

    return {
        "cpu": round(cpu, 2),
        "memory_gb": round(mem, 2),
        "prediction": status,
        "trained": monitor.is_trained
    }

# --- protected endpoint ---
# notice the dependency: you need a key to run this!
@app.get("/mitigate", dependencies=[Depends(verify_api_key)])
def mitigate_threat():
    try:
        # kill the 'yes' process (simulated threat)
        subprocess.run(["pkill", "yes"], check=True)
        return {"status": "success", "message": "threat neutralized."}
    except subprocess.CalledProcessError:
        return {"status": "error", "message": "no active threat found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}