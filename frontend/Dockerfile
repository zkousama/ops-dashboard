# 1. use node.js alpine
FROM node:20-alpine

# 2. set working directory
WORKDIR /app

# 3. copy package files first
COPY package.json package-lock.json* ./

# 4. install dependencies
RUN npm install

# 5. copy the rest of the code
COPY . .

# 6. build the next.js application for production
RUN npm run build

# 7. start the app
CMD ["npm", "start"]
