#!/bin/bash

docker kill ws-server-uvls
docker rm ws-server-uvls

docker build -t ws-server-uvls .
docker run --name ws-server-uvls -d -p 30000:30000 -t ws-server-uvls:latest