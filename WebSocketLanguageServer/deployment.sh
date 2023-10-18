#!/bin/bash

docker build -t ws-server-uvls .
docker run -p 30000:30000 -it ws-server-uvls:latest