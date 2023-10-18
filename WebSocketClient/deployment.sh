#!/bin/bash

docker kill uvl-playground-website
docker rm uvl-playground-website

docker build -t uvl-playground-website .
docker run --name uvl-playground-website -d -p 80:80 -t uvl-playground-website