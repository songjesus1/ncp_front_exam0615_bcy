#!/usr/bin/env bash
#우분투 내 환경변수 설정하는 구문
set -e

IMAGE_NAME="my-diary-frontend"
CONTAINER_NAME="my-diary-frontend"

#Private 서버의 사설 IP 설정
BACKEND_HOST="${BACKEND_HOST:-10.10.2.6}"

cd "$(dirname "$0")/.."

#기존 컨테이너 중지/삭제하는 구문
# 환경변수 데이터 접근방법 : $환경변수명
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

#frontend 이미지 빌드하는 구문
# 이미지 빌드 시 Backend 호스트주소를 주입
docker build \
  --build-arg BACKEND_HOST="$BACKEND_HOST" \
  -t "$IMAGE_NAME" .

#컨테이너 실행하는 구문
docker run -d \
  --name "$CONTAINER_NAME" \
  -p 80:80 \
  -e BACKEND_HOST="$BACKEND_HOST" \
  --restart unless-stopped \
  "$IMAGE_NAME"

echo "Frontend container is running."
