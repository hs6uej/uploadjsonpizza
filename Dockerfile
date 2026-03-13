# Use node 18 slim as suggested
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Create the upload directory and set permissions
RUN mkdir -p "/app/chatmenupizza/Menu JSON"

# Expose the internal port
EXPOSE 3000

# Start the application
CMD [ "node", "server.js" ]
