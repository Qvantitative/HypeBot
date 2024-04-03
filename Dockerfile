FROM node:latest

# Install necessary packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gnupg2 \
        wget \
    && wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add - \
    && echo "deb http://repo.mongodb.org/apt/debian bookworm/mongodb-org/5.0 main" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        mongodb-org \
        build-essential \
        ffmpeg \
        libjpeg-dev \
        libcairo2-dev \
        libgif-dev \
        libpango1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up Node.js environment
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install -g node-gyp \
    && npm install

# Copy the rest of the application code
COPY . .

# Set the default command
CMD [ "node", "index.js" ]