import os
import sys
import multiprocessing
from dotenv import load_dotenv

if getattr(sys, "frozen", False):
    exe_dir = os.path.dirname(sys.executable)
else:
    exe_dir = os.path.dirname(os.path.abspath(__file__))

env_path = os.path.join(exe_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

os.chdir(exe_dir)
if exe_dir not in sys.path:
    sys.path.insert(0, exe_dir)

from app.main import app
import uvicorn

if __name__ == "__main__":
    multiprocessing.freeze_support()
    print("[ASCEND-JARVIS] Starting standalone JARVIS backend service on 127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
