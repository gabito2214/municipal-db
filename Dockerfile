# Use official Node.js image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
# Copy package files
COPY package*.json ./

# Install build dependencies for native modules (sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose a default port (Render will override this via PORT env var)
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]
