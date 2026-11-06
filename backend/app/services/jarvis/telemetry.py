"""Hardware and system telemetry for ASCEND JARVIS System Monitor.
Collects real hardware metrics: CPU, GPU (NVIDIA SMI), RAM, Storage, Network, and Top Processes.
"""
from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import psutil
    _PSUTIL_OK = True
except ImportError:
    _PSUTIL_OK = False


def check_performance() -> str:
    """Brief natural language summary of PC performance."""
    if not _PSUTIL_OK:
        return "System telemetry unavailable: psutil not installed."
    try:
        cpu = psutil.cpu_percent(interval=0.2)
        ram = psutil.virtual_memory().percent
        disk = psutil.disk_usage(str(Path.home())).percent
        return f"CPU at {cpu:.0f}%, RAM at {ram:.0f}%, disk at {disk:.0f}% used."
    except Exception as e:
        return f"Performance check error: {e}"


def _cpu_temperature_c() -> Optional[float]:
    """ACPI thermal zone via WMI — returns None if hardware does not expose it."""
    try:
        import win32com.client
        wmi = win32com.client.GetObject(r"winmgmts:\\.\root\wmi")
        zones = wmi.ExecQuery("SELECT CurrentTemperature FROM MSAcpi_ThermalZoneTemperature")
        temps = [zone.CurrentTemperature for zone in zones]
        if not temps:
            return None
        # ACPI reports in tenths of a Kelvin
        return round((max(temps) / 10) - 273.15, 1)
    except Exception:
        return None


_GPU_FIELDS = ("gpu_name", "gpu_percent", "gpu_temp_c", "gpu_vram_used_mb", "gpu_vram_total_mb")
_NO_GPU = dict.fromkeys(_GPU_FIELDS, None)


def _gpu_stats() -> Dict[str, Any]:
    """Sample NVIDIA GPU stats via nvidia-smi command."""
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return dict(_NO_GPU)
        name, util, temp, used, total = (p.strip() for p in result.stdout.strip().splitlines()[0].split(","))
        return {
            "gpu_name": name,
            "gpu_percent": float(util),
            "gpu_temp_c": float(temp),
            "gpu_vram_used_mb": float(used),
            "gpu_vram_total_mb": float(total),
        }
    except Exception:
        return dict(_NO_GPU)


def _network_up() -> bool:
    if not _PSUTIL_OK:
        return False
    try:
        return any(s.isup for name, s in psutil.net_if_stats().items() if "loopback" not in name.lower())
    except Exception:
        return False


def get_telemetry() -> Dict[str, Any]:
    """Sample fresh hardware telemetry."""
    if not _PSUTIL_OK:
        return {
            "cpu_percent": 0.0,
            "cpu_temp_c": None,
            "ram_percent": 0.0,
            "ram_used_gb": 0.0,
            "ram_total_gb": 0.0,
            "storage_percent": 0.0,
            "storage_used_gb": 0.0,
            "storage_total_gb": 0.0,
            "download_kbps": 0.0,
            "upload_kbps": 0.0,
            "network_up": False,
            "battery_percent": None,
            "battery_plugged": None,
            "uptime_seconds": 0,
            **dict(_NO_GPU),
        }

    try:
        net_before = psutil.net_io_counters()
        cpu_percent = psutil.cpu_percent(interval=0.4)
        net_after = psutil.net_io_counters()

        # Scale network over sample interval
        interval = 0.4
        download_kbps = max(0.0, ((net_after.bytes_recv - net_before.bytes_recv) / 1024) / interval)
        upload_kbps = max(0.0, ((net_after.bytes_sent - net_before.bytes_sent) / 1024) / interval)

        vmem = psutil.virtual_memory()
        disk = psutil.disk_usage(str(Path.home()))

        battery = psutil.sensors_battery()
        bat_pct = round(battery.percent, 1) if battery else None
        bat_plugged = battery.power_plugged if battery else None

        boot_time = psutil.boot_time()
        uptime_seconds = int(time.time() - boot_time)

        return {
            "cpu_percent": round(cpu_percent, 1),
            "cpu_temp_c": _cpu_temperature_c(),
            "ram_percent": round(vmem.percent, 1),
            "ram_used_gb": round(vmem.used / (1024**3), 2),
            "ram_total_gb": round(vmem.total / (1024**3), 2),
            "storage_percent": round(disk.percent, 1),
            "storage_used_gb": round(disk.used / (1024**3), 1),
            "storage_total_gb": round(disk.total / (1024**3), 1),
            "download_kbps": round(download_kbps, 1),
            "upload_kbps": round(upload_kbps, 1),
            "network_up": _network_up(),
            "battery_percent": bat_pct,
            "battery_plugged": bat_plugged,
            "uptime_seconds": uptime_seconds,
            **_gpu_stats(),
        }
    except Exception as e:
        return {
            "error": str(e),
            "cpu_percent": 0.0,
            "ram_percent": 0.0,
            "storage_percent": 0.0,
            "download_kbps": 0.0,
            "upload_kbps": 0.0,
            "network_up": False,
            **dict(_NO_GPU),
        }


def get_top_processes(limit: int = 15) -> List[Dict[str, Any]]:
    """Return top processes sorted by CPU and memory usage."""
    if not _PSUTIL_OK:
        return []
    procs = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
        try:
            info = p.info
            if info["name"]:
                procs.append({
                    "pid": info["pid"],
                    "name": info["name"],
                    "cpu_percent": round(info["cpu_percent"] or 0.0, 1),
                    "memory_percent": round(info["memory_percent"] or 0.0, 1),
                    "status": info["status"] or "running",
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    procs.sort(key=lambda x: (x["cpu_percent"], x["memory_percent"]), reverse=True)
    return procs[:limit]
