FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/
COPY src ./src/
RUN npm install
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/
RUN npm install
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
CMD ["npm", "start"]
