# Stage 1: Build the React app
FROM node:16 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the React app
FROM node:16
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/build ./build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "80"]