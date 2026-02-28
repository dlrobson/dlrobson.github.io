FROM node:24.13-trixie-slim

ENV USER=node \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update && \
    apt-get install -y \
    # Required for mermaid diagrams
    chromium \
    # Development packages
    git locales procps sudo && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && locale-gen && \
    chsh -s /bin/bash node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

USER node
WORKDIR /home/node
