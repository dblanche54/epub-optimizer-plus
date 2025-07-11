FROM node:23-slim

# Install Java 17 and download tools
RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@9.5.0

WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm build

# Download and setup EPUBCheck 5.2.1, then clean up
RUN wget https://github.com/w3c/epubcheck/releases/download/v5.2.1/epubcheck-5.2.1.zip \
    && unzip epubcheck-5.2.1.zip \
    && mv epubcheck-5.2.1 epubcheck \
    && rm epubcheck-5.2.1.zip \
    && apt-get remove -y wget unzip \
    && apt-get autoremove -y \
    && apt-get clean

# Create a volume mount point for EPUB files
VOLUME ["/epub-files"]

# Set the entrypoint to your pipeline script
ENTRYPOINT ["node", "dist/src/pipeline.js"]