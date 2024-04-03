FROM node:latest

# Install MongoDB
RUN apt-get update && apt-get install -y mongodb

# Set up Node.js environment
WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --update --no-cache npm ffmpeg \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev && \
    npm install -g node-gyp && \
    npm install

COPY . .

CMD [ "node", "index.js" ]