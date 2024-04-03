FROM node:latest

# Install necessary packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gnupg2 \
        wget \
        ffmpeg \
        libjpeg-dev \
        libcairo2-dev \
        libgif-dev \
        libpango1.0-dev \
        build-essential \
        python3 \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install MongoDB client tools
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 656408E390CFB1F5AA7A6F7C8F6F0025E3129272 \
    && echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org-tools \
    && rm -rf /var/lib/apt/lists/*

# Set up Node.js environment
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g node-gyp \
    && npm install

COPY . .

CMD [ "node", "index.js" ]