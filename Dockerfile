FROM node:20-bookworm-slim

# Install OpenSSL & default-mysql-client (for mysqldump feature)
RUN apt-get update -y && \
    apt-get install -y openssl default-mysql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications & Prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies (runs postinstall prisma generate natively on Linux)
RUN npm ci --legacy-peer-deps

# Copy application source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose Next.js production port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run database migrations and start production server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
