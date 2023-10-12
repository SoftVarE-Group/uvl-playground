FROM node:18

WORKDIR /usr/src/uvlPlayground

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
RUN npm run build

RUN chmod +x ./start_servers.sh

CMD ["/bin/sh", "./start_servers.sh"]