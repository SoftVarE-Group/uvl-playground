#!/bin/bash



docker build -t uvl-playground .
docker run -p 8080:8080 -p 30000:30000 -it uvl-playground:latest

