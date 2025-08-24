#!/usr/bin/env python3
"""
Production startup script for CarbonTwin backend
Optimized for Render deployment with memory constraints
"""

import os
import sys
import logging

# Configure logging before importing anything else
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("carbontwin-startup")

def main():
    try:
        logger.info("=== CarbonTwin Backend Starting ===")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Working directory: {os.getcwd()}")
        logger.info(f"Port: {os.environ.get('PORT', '5000')}")
        
        # Import and initialize the app
        from app import app, socketio, logger as app_logger
        
        app_logger.info("Application imported successfully")
        app_logger.info("Starting CarbonTwin API server...")
        
        port = int(os.environ.get("PORT", 5000))
        
        # Run with SocketIO
        socketio.run(
            app, 
            debug=False, 
            host="0.0.0.0", 
            port=port,
            use_reloader=False,
            log_output=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
