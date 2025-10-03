FROM node:20-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY .env.example ./
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY package*.json ./
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]


