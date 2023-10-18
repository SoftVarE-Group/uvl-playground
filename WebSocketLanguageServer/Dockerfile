FROM node:18
# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 30000

CMD [ "npm", "run", "start" ]