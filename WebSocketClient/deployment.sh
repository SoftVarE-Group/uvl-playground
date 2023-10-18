#!/bin/bash

docker kill uvl-playground-website
docker rm uvl-playground-website

docker build -t uvl-playground-website .
docker run --name uvl-playground-website -d -p 80:80 -e PORT=30000 -e UVLS_HOST_NAME=http://590c9306-8ced-48f6-85f2-bb8caa1bfd52.ul.bw-cloud-instance.org/ -t uvl-playground-website
