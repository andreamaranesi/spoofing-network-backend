FROM node:lts-stretch-slim
WORKDIR /usr/src/app-node
COPY . .
RUN npm install
RUN npm install typescript -g
RUN tsc
CMD ["npm", "start"]

