#!/usr/bin/env python3
import os

# Gunicorn configuration for production deployment
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Worker configuration - optimized for Render
workers = 1  # Single worker to avoid memory issues on small instances
worker_class = "sync"  # Changed from eventlet to sync for stability
worker_connections = 100  # Reduced from 1000
timeout = 120  # Increased timeout for AI processing
keepalive = 2

# Memory management
max_requests = 500  # Reduced to prevent memory leaks
max_requests_jitter = 25  # Reduced proportionally
worker_tmp_dir = "/dev/shm"  # Use shared memory for better performance
preload_app = True

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "carbontwin"

# Graceful timeout
graceful_timeout = 30
