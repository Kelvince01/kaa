#!/usr/bin/env bash
# Install node-gyp, build tools and pngquant
npm install -g node-gyp
apt-get update && apt-get install -y python3 make g++ build-essential libssl-dev pngquant
# Continue normal build

# Install dependencies
bun install

# Compile the project
bun compile

# Start the server
# bun run server