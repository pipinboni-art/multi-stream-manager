
FROM node:18

WORKDIR /app
COPY . .
RUN npm install

# Ensure uploads folder exists
RUN mkdir -p uploads

# ffmpeg available in base node image on Railway
RUN apt-get update && apt-get install -y ffmpeg

EXPOSE 3000
CMD ["node", "server.js"]
