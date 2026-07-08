FROM node:20-alpine

WORKDIR /workspace

COPY package.json .

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
