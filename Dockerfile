FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y python3 python3-pip curl && \
    pip3 install --break-system-packages --upgrade yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV YT_DLP_JS_RUNTIME=node

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3001

CMD ["npm", "start"]
