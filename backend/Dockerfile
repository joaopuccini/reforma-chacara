FROM node:22-alpine AS builder

WORKDIR /app
# Instala dependências necessárias para compilar módulos nativos (como bcrypt, esbuild, v8-coverage) no Alpine
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
