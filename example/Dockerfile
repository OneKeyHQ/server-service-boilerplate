FROM node:18-alpine AS build

WORKDIR /app
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

COPY package.json yarn.lock .

RUN yarn set version stable
RUN yarn install --immutable

COPY . .
RUN yarn run prepare-env
RUN yarn run build

FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
# 把源代码复制过去， 以便报错能报对行
COPY --from=build /app/src ./src
COPY --from=build /app/bootstrap.js ./
COPY --from=build /app/package.json ./
COPY --from=build /app/.env.default ./

RUN apk add --no-cache tzdata

ENV TZ="Asia/Shanghai"

RUN yarn set version stable
RUN yarn workspaces focus --production

EXPOSE 9004

CMD ["yarn", "run", "start"]