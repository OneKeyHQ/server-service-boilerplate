FROM node:24-alpine AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

RUN yarn install --immutable

COPY . .

RUN yarn run build

FROM node:24-alpine

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

RUN apk add --no-cache tzdata && rm -rf /var/cache/apk/*

COPY --from=build /app /app

RUN yarn run prepare-env\
  && yarn workspaces focus --production\
  && yarn cache clean

ENV TZ="Asia/Shanghai"

EXPOSE 80

CMD ["yarn", "run", "start"]