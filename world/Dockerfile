# Use a Node.js base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the current directory's contents into the container
COPY . /app

# Install project dependencies
RUN npm install

RUN npm run build

# Run the JavaScript file
CMD ["npm", "start"]