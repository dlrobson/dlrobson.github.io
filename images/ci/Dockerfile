FROM node:25.6-trixie-slim

ENV USER=node

RUN apt-get update && \
    apt-get install -y \
    git \
    # Development packages
    locales procps sudo && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
    
RUN echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && locale-gen && \
    chsh -s /bin/bash node && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

USER node
WORKDIR /home/node
