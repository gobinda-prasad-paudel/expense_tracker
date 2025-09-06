# Safer for Puppeteer than *-slim
FROM node:20-bookworm

WORKDIR /app
COPY package*.json ./
# Install prod deps (Puppeteer downloads Chromium)
RUN npm ci --omit=dev

# System deps often needed by Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 \
    libnspr4 libnss3 libxcb1 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libxrender1 libxshmfence1 libxss1 libxtst6 wget xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
