# 1. use a lightweight python base image
FROM python:3.11-slim

# 2. install 'procps' so we can use the 'pkill' command inside linux
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

# 3. set the working directory inside the container
WORKDIR /app

# 4. copy specific files to install dependencies first (docker caching magic)
COPY requirements.txt .

# 5. install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 6. copy the rest of the application
COPY . .

# 7. run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
