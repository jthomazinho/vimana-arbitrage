##################
### BUILD STEP ###
##################
FROM node:15.9.0-buster-slim as builder
RUN node -v \
    && npm -v  \
    && mkdir /app

WORKDIR /app

### CLIENT ###
RUN mkdir /app/client
COPY client ./client/
RUN cd ./client/ \
    && npm ci \
    && npm run build

### SERVER ###
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ .

RUN npm run build && npm prune --production

################
### RUN STEP ###
################
FROM node:15.9.0-buster-slim as runner

RUN apt update \
    && apt install -y wget \
    && wget -O parameter-store-exec.tar.gz https://github.com/cultureamp/parameter-store-exec/releases/download/v1.1.0/parameter-store-exec-v1.1.0-linux-amd64.tar.gz \
    && tar -xzf parameter-store-exec.tar.gz \
    && rm parameter-store-exec.tar.gz \
    && mv parameter-store-exec /bin/parameter-store-exec \
    && chmod +x /bin/parameter-store-exec

RUN mkdir /app
WORKDIR /app

### SERVER ###
COPY server/package.json server/package-lock.json ./

ENV NODE_ENV=production
RUN npm ci

COPY --from=builder /app/build/ .
COPY server/scripts/entrypoint.sh /bin/
COPY server/.sequelizerc /app/
COPY --from=builder /app/client/build public

RUN chown -R node:node /app/

USER node

CMD [ "npm", "start" ]

ENTRYPOINT [ "/bin/entrypoint.sh" ]
