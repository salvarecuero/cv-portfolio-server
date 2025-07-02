FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's build cache.
# If these files don't change, npm install won't re-run in subsequent builds.
COPY package*.json ./

RUN npm install --omit=dev

# Copy the rest of your application code to the working directory
COPY . .

# Expose the port your Node.js application listens on.
EXPOSE 3000

CMD ["node", "index.js"]