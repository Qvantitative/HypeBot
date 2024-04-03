FROM node:latest

# Set up Node.js environment
WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN apt-get update \
    && apt-get install -y \
        mongodb-clients \
        make \
        g++ \
        ffmpeg \
        jpeg-dev \
        cairo-dev \
        giflib-dev \
        pango-dev \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g node-gyp \
    && npm install

COPY . .

CMD [ "node", "index.js" ]