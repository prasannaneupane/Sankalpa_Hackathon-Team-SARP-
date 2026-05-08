# Backend Dockerfile

# Use Node.js 20 as the base image
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .


EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]