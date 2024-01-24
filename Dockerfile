FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

RUN yarn install --immutable

COPY . .

RUN yarn run build

FROM node:18-alpine

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

RUN apk add --no-cache tzdata && rm -rf /var/cache/apk/*

COPY --from=build /app /app

# 防止 test 环境加载配置出错
RUN rm ./dist/config/config.unittest.*\
  && yarn run prepare-env\
  && yarn workspaces focus --production\
  && yarn cache clean

ENV TZ="Asia/Shanghai"

EXPOSE 7001

CMD ["yarn", "run", "start"]