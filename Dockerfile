# node 이미지 빌드
FROM node:24-slim AS build

#작업 디렉토리 생성 및 설정
WORKDIR /app

#현재 위치에 있는 package.*json을 /app폴더로 이동하고
#dependencies에 있는 라이브러리 설치
COPY package*.json ./

RUN npm install

#현재 위치에 있는 파일들을 .app폴더로 복사
#build 명령어로 React 정적 웹 파일 생성
COPY . .
RUN npm run build

#nginx이미지 빌드
FROM nginx:alpine

#nginx 실행 시 BACKEND_HOST에 환경변수 주입
#ENV BACKEND_HOST=${BACKEND_HOST}

# nginx 설정 템플릿 파일을 conf.d폴더로 복사
#default.conf.template->conf.d폴더 내 default.conf로 자동 치환
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# node 이미지 빌드과정에서 생성된 React 정적 폴더 '/dist'를
#nginx의 html폴더로 복사
COPY --from=build /app/dist /usr/share/nginx/html

#해당 컨테이너의 포트를 80으로 설정
EXPOSE 80
