FROM node:20

# Tizimga kerakli dasturlarni o'rnatish
RUN apt-get update && apt-get install -y ffmpeg python3 curl

# Linux uchun yt-dlp ni yuklab olish va o'rnatish
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "src/bot.js"]