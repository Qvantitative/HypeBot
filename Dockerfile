FROM node:latest

# Install necessary packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        mongodb \
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