# build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:24-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --production


COPY --from=builder /app . 

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
