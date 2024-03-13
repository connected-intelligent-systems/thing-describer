FROM node:20.11.0-alpine3.18

RUN apk --no-cache add curl

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

USER node

HEALTHCHECK CMD exit 0

CMD ["/app/run.sh"]
