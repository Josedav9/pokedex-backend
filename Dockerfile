FROM node:slim

WORKDIR /app

COPY ["package.json", "./"]

RUN npm install

COPY . .

RUN npm run compile

CMD [ "node", "./dist/server.js" ]