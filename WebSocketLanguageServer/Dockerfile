FROM node:18
# Create app directory
WORKDIR /usr/src/app

RUN apt-get update \
    && apt-get install -y z3 \
    && apt-get clean

COPY package*.json ./

RUN npm install

COPY . .

#EXPOSE 30000

RUN npm run build

CMD [ "npm", "run", "start" ]
