#!/usr/bin/env bash
set -euo pipefail
# 官方 Tesseract tessdata_fast 中文模型，Apache-2.0；无收费API。
mkdir -p .models
curl -fL --max-time 60 https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/chi_sim.traineddata -o .models/chi_sim.traineddata
