# Use a Node.js base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the current directory's contents into the container
COPY . /app

# Install project dependencies
RUN npm install

# Run the JavaScript file
CMD ["node", "index.js"]