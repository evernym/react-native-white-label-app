FROM ubuntu:18.04

# Install libraries
RUN apt-get update -y && apt-get install -y \
    git \
    curl \
    ca-certificates \
    software-properties-common

# Install Nodejs
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs

# Install Yarn
RUN npm install -g yarn

# Add Evernym Cert
RUN mkdir -p /usr/local/share/ca-certificates
RUN curl -k https://repo.corp.evernym.com/ca.crt | tee /usr/local/share/ca-certificates/Evernym_Root_CA.crt
RUN update-ca-certificates
