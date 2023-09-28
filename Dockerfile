FROM node:20

RUN apt-get update && apt-get install -y \
  dumb-init \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN npm install -g forever

COPY docker/run.sh /app
RUN chmod +x /app/run.sh

COPY package.json /app
RUN npm install --production
RUN npm install cross-env

COPY index.js /app
COPY ./lib /app/lib

EXPOSE 3000

CMD ["dumb-init", "./run.sh"]
