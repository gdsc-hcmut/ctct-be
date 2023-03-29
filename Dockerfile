FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY package.json ./package.json
RUN yarn install

COPY --chown=node:node . .
RUN yarn build

ENV PORT 5000
ENV NODE_ENV production
ENV WORKING_DIR /home/node/app

EXPOSE 5000

CMD ["yarn", "start"]
