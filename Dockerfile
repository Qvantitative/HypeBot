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

# Download MongoDB GPG key and import it
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -

# Add MongoDB repository and install MongoDB client tools
RUN echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org-tools \
    && rm -rf /var/lib/apt/lists/*

# Set up Node.js environment
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g node-gyp \
    && npm install

COPY . .

CMD [ "node", "bot.js" ]