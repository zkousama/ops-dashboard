# opsguard: ai-driven intrusion prevention system (poc)

**disclaimer: this is a proof of concept (poc) designed for educational purposes.**
it demonstrates the architecture of modern security tools but is **not** intended for production use. it lacks authentication, persistence, and safety checks required for a real-world environment.

---

opsguard is a **microservices-based security platform** that combines real-time observability with machine learning to detect and neutralize system threats automatically.

unlike passive monitoring tools (like grafana), opsguard simulates an **active defense system**. it uses an unsupervised learning model (isolation forest) to learn "normal" server behavior and automatically triggers counter-measures when anomalies are detected.

![status](https://img.shields.io/badge/status-educational_poc-orange)
![docker](https://img.shields.io/badge/docker-containerized-blue)
![tech](https://img.shields.io/badge/stack-next.js_16_|_python_3.11_|_prometheus-black)

## 🚀 key features

* **real-time observability:** pulls live metrics (cpu, ram) from prometheus every 2 seconds.
* **ai anomaly detection:** uses `scikit-learn` (isolation forest) to detect zero-day attacks and deviations without labeled data.
* **active mitigation:** features a "kill switch" capability that allows the containerized system to interact with the host os kernel to terminate malicious processes.
* **hot reloading:** docker volumes are set up for instant dev feedback—code changes reflect immediately.
* **full docker support:** entire stack runs in isolated containers with internal networking.

## 🏗️ architecture

the system consists of 4 dockerized microservices:

1.  **the victim (node exporter):** exposes raw kernel metrics.
2.  **the watcher (prometheus):** time-series database that scrapes metrics.
3.  **the brain (python/fastapi):**
    * queries prometheus.
    * runs the isolation forest model.
    * exposes a rest api for the frontend.
    * **special capability:** runs with `pid: host` to manage host processes.
4.  **the face (next.js 16):**
    * real-time dashboard using swr and recharts.
    * provides the mitigation interface.

## 🛠️ tech stack

* **frontend:** next.js 16.1 (app router), react 19, tailwindcss v4, recharts, lucide-react.
* **backend:** python 3.11, fastapi, scikit-learn 1.8, pandas, numpy.
* **devops:** docker, docker compose, prometheus, linux process management.

## ⚡ getting started

### prerequisites
* docker & docker compose

### installation

1.  clone the repository:
    ```bash
    git clone [https://github.com/zkousama/ops-dashboard.git](https://github.com/zkousama/ops-dashboard.git)
    cd ops-dashboard
    ```

2.  launch the stack (with hot reload enabled):
    ```bash
    docker-compose up --build -d
    ```

3.  access the dashboard:
    * open `http://localhost:3000`

### 🧪 how to test the "active defense"

1.  **simulate an attack:**
    run a cpu stress test on your host machine:
    ```bash
    yes > /dev/null &
    ```

2.  **observe:**
    the dashboard will turn **red** ("threat detected") as the ai flags the cpu spike.

3.  **neutralize:**
    click the **mitigate threat** button on the dashboard.
    * the python backend will identify the malicious process and kill it.
    * system status will return to **green**.

## ⚖️ license
mit