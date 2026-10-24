# Stage 1: Build the app
# Node 24 (LTS). Node 18 dejó de recibir parches de seguridad en abril de 2025
FROM node:24-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json if available
COPY package*.json ./

# Install dependencies (npm ci: exactamente las versiones del package-lock)
RUN npm ci

# Copy the rest of the project files
COPY . .

# Build the Vite app
RUN npm run build

# Stage 2: Serve the app using a static server
FROM nginx:alpine

# Copy the built app from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]