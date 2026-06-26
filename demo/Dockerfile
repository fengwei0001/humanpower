FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./
RUN npm install pg dotenv --omit=dev
EXPOSE 3000
CMD ["node", "server.cjs"]
