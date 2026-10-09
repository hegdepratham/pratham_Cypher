FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/data/kaveri.db

RUN mkdir -p /data && chown -R node:node /app /data

USER node

EXPOSE 4000

CMD ["npm", "start"]