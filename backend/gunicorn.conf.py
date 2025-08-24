#!/usr/bin/env python3

# Gunicorn configuration for production deployment
bind = "0.0.0.0:10000"
workers = 1
worker_class = "eventlet"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
preload_app = True
