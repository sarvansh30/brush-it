FROM node:24-alpine AS Builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

#-----------------------
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production   

EXPOSE 3000

CMD ["node", "server.js"]