# OpsGuard: AI-Driven Intrusion Prevention System (IPS) 🛡️

OpsGuard is a **Microservices-based Security Platform** that combines real-time observability with machine learning to detect and neutralize system threats automatically.

Unlike passive monitoring tools (like Grafana), OpsGuard is an **Active Defense System**. It uses an unsupervised learning model (Isolation Forest) to learn "normal" server behavior and automatically triggers counter-measures when anomalies are detected.

![Project Status](https://img.shields.io/badge/Status-Active_Defense-green)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Tech](https://img.shields.io/badge/Stack-Next.js_|_Python_|_Prometheus-black)

## 🚀 Key Features

* **Real-Time Observability:** Pulls live metrics (CPU, RAM) from Prometheus every 2 seconds.
* **AI Anomaly Detection:** Uses `scikit-learn` (Isolation Forest) to detect zero-day attacks and deviations without labeled data.
* **Active Mitigation:** Features a "Kill Switch" capability that allows the containerized system to interact with the Host OS kernel to terminate malicious processes.
* **Full Docker Support:** Entire stack runs in isolated containers with internal networking.

## 🏗️ Architecture

The system consists of 4 Dockerized microservices:

1.  **The Victim (Node Exporter):** Exposes raw kernel metrics.
2.  **The Watcher (Prometheus):** Time-series database that scrapes metrics.
3.  **The Brain (Python/FastAPI):**
    * Queries Prometheus.
    * Runs the Isolation Forest model.
    * Exposes a REST API for the frontend.
    * **Special Capability:** Runs with `pid: host` to manage host processes.
4.  **The Face (Next.js 14):**
    * Real-time dashboard using SWR and Recharts.
    * Provides the mitigation interface.

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), TailwindCSS, Recharts, Lucide React.
* **Backend:** Python 3.11, FastAPI, Scikit-learn, Pandas.
* **DevOps:** Docker, Docker Compose, Prometheus, Linux Process Management.

## ⚡ Getting Started

### Prerequisites
* Docker & Docker Compose

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/ops-guard.git](https://github.com/YOUR_USERNAME/ops-guard.git)
    cd ops-guard
    ```

2.  Launch the stack:
    ```bash
    docker-compose up --build -d
    ```

3.  Access the Dashboard:
    * Open `http://localhost:3000`

### 🧪 How to Test the "Active Defense"

1.  **Simulate an Attack:**
    Run a CPU stress test on your host machine:
    ```bash
    yes > /dev/null &
    ```

2.  **Observe:**
    The dashboard will turn **RED** ("THREAT DETECTED") as the AI flags the CPU spike.

3.  **Neutralize:**
    Click the **MITIGATE THREAT** button on the dashboard.
    * The Python backend will identify the malicious process and kill it.
    * System status will return to **GREEN**.

## ⚖️ License
MIT