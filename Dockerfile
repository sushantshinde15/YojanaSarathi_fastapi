# ---- Base image ----
# Start from an official, lightweight Python 3.12 image.
# "slim" = Debian Linux with just enough installed to run Python -
# much smaller than the full python:3.12 image, faster to build/deploy.
FROM python:3.12.8-slim

# ---- Set the working directory inside the container ----
# All following commands (COPY, RUN, CMD) happen relative to this folder.
# It's created automatically if it doesn't exist.
WORKDIR /app

# ---- System dependencies ----
# gcc + build-essential are sometimes needed to build Python packages
# that include compiled C code (pandas/numpy/scikit-learn/scipy can
# need this depending on whether prebuilt wheels are available).
# Installing this first (before copying app code) means Docker can
# reuse this layer on rebuilds unless this line itself changes.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Python dependencies ----
# Copy ONLY requirements.txt first, not the whole project. Docker
# caches each step: if requirements.txt hasn't changed since your
# last build, Docker skips reinstalling everything and reuses the
# cached layer, which makes rebuilds much faster.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Copy the rest of the application code ----
# Now copy everything else (main.py, templates/, static/, test.csv,
# scheme_model.pkl, translations.json). .dockerignore (next file)
# controls what NOT to copy.
COPY . .

# ---- Document which port the app listens on ----
# This is informational only (doesn't actually publish the port) -
# Render reads the real port from the $PORT env var it injects,
# which the CMD below picks up.
EXPOSE 8000

# ---- Start the app ----
# Run uvicorn directly (not "python main.py") so the __main__ block
# in main.py is never triggered. $PORT is supplied by Render at
# runtime; we default to 8000 for local testing if it's not set.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
