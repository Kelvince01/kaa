#!/usr/bin/env bash
# Install node-gyp and build tools
npm install -g node-gyp
apt-get update && apt-get install -y python3 make g++
# Continue normal build
bun install
