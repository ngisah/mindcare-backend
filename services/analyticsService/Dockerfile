# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Make port 3006 available to the world outside this container
EXPOSE 3006

# Run the app when the container launches
CMD ["node", "index.js"] 