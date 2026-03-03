#!/bin/bash
cd /home/kavia/workspace/code-generation/civic-gis-viewer-with-ai-assistant-327705-327714/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

