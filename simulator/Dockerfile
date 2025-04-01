FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV ORION_URL=http://orion:1026

CMD ["npm", "start"]

