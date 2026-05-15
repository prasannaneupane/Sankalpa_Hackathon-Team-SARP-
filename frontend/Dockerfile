# Frontend Dockerfile

# Use Node.js 20 as the base image for building
FROM node:20 as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Build the frontend
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]