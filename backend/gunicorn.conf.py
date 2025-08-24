#!/usr/bin/env python3
import os

# Gunicorn configuration for production deployment
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"
workers = 1
worker_class = "eventlet"
worker_connections = 1000
timeout = 60  # Increased from 30 to 60 seconds for AI requests
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
preload_app = True
