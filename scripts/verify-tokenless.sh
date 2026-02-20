#!/usr/bin/env bash
# Copyright (c) 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
# Verify no API keys or tokens are embedded in agent source code.
set -euo pipefail

echo "Scanning src/ for forbidden patterns..."

FORBIDDEN_PATTERNS=(
  "sk-ant-"
  "sk-proj-"
  "sk-"
  "ANTHROPIC_API_KEY"
  "OPENAI_API_KEY"
  "api_key.*=.*['\"]sk"
)

FOUND=0

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if grep -rn "$pattern" src/ --include="*.ts" 2>/dev/null | grep -v "process.env" | grep -v "test/" | grep -v ".test."; then
    echo "VIOLATION: Found forbidden pattern '$pattern' in source code"
    FOUND=1
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "PASS: No forbidden patterns found in src/"
  exit 0
else
  echo "FAIL: Forbidden patterns detected. Agents must not embed API keys."
  exit 1
fi
