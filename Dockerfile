FROM node:18

# Install Python and dependencies
RUN apt-get update && apt-get install -y python3 python3-pip

# Create app directory
WORKDIR /app

# Copy all code
COPY . .

# Set up Python environment for OpenOMR
RUN pip3 install -r OpenOMR/requirements.txt

# Install Node.js packages
RUN npm install

# Expose port
EXPOSE 3000

# Start Node.js app
CMD ["node", "index.js"]
