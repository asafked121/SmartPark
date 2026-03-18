# This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
