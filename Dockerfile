from node:8.5

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY ali-dns-api.js /usr/src/app/
COPY index.js /usr/src/app/
COPY ip.txt  /usr/src/app/
RUN npm install --registry=https://registry.npm.taobao.org

CMD [ "npm", "start" ]