from setuptools import setup, find_packages

setup(
    name="carbontwin-backend",
    version="1.0.0",
    description="CarbonTwin AI-Powered Carbon Management Platform",
    packages=find_packages(),
    install_requires=[
        "flask==2.3.2",
        "flask-cors==4.0.0", 
        "flask-socketio==5.3.4",
        "python-dotenv==1.0.0",
        "requests==2.31.0",
        "python-socketio==5.8.0",
        "python-engineio==4.7.1",
        "gunicorn==21.2.0",
        "eventlet==0.33.3",
        "numpy==1.24.3",
        "openai==0.28.1",
        "web3==6.9.0",
        "werkzeug==2.3.6"
    ],
    python_requires=">=3.11,<3.12"
)
