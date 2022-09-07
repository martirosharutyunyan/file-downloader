FROM node:18


# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ["package.json", "yarn.lock", "tsconfig.json", "./"]

RUN yarn install --production
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

# for typescript
RUN yarn build


CMD yarn start
