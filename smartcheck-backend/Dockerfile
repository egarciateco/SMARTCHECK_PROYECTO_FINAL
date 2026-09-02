FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema para compilar dlib y OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Actualizar pip e instalar los requerimientos
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "motor_smartcheck:app", "--host", "0.0.0.0", "--port", "8000"]