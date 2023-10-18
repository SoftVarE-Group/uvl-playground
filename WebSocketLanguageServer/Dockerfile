FROM node:18
# Create app directory
WORKDIR /usr/src/app

#RUN apt-get update
#RUN apt-get install z3

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 30000

RUN npm run build

CMD [ "npm", "run", "start" ]