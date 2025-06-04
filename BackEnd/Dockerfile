# -------- Stage 1: Build dependencies --------
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

# -------- Stage 2: Final image --------
FROM node:18-slim

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules

COPY . .

CMD ["npm", "start"]
