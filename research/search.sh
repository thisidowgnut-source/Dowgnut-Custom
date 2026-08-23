#!/bin/bash
# $1 = output file, $2 = query, $3 = num
z-ai function -n web_search -a "{\"query\": \"$2\", \"num\": ${3:-8}}" -o "$1" 2>/dev/null && echo "OK: $1" || echo "FAIL: $1"
sleep 6
