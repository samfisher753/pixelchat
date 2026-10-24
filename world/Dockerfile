# Node 24 (LTS). Node 18 dejó de recibir parches de seguridad en abril de 2025
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the current directory's contents into the container
COPY . /app

# Install project dependencies (npm ci: exactamente las versiones del package-lock, con sus parches)
RUN npm ci

RUN npm run build

# Run the JavaScript file
CMD ["npm", "start"]