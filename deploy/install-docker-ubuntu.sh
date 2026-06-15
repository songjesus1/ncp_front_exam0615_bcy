#!/usr/bin/env bash
set -e

if command -v docker >/dev/null 2>&1; then
  echo "Docker is already installed."
  docker --version
  exit 0
fi

sudo apt update
sudo apt install -y docker.io

sudo systemctl enable docker
sudo systemctl start docker

sudo usermod -aG docker "$USER"

echo "Docker installation completed."
docker --version
