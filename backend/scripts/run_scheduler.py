#!/usr/bin/env python
"""
Standalone entrypoint for the daily scheduled jobs.

Usage:
    python scripts/run_scheduler.py

Intended to be invoked by an external cron trigger (Railway Cron Job or a
scheduled GitHub Actions workflow) once per day, ideally at or just after
midnight in the platform's primary timezone.
"""
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scheduler import run_daily_jobs  # noqa: E402

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    run_daily_jobs()
