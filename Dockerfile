# ---- Build Stage (Frontend) ----
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production Stage (Backend + Frontend) ----
FROM node:20-alpine
WORKDIR /app

# Copy package files and install production dependencies for backend
COPY package*.json ./
RUN npm install --production

# Copy backend files
COPY server.ts ./
COPY tsconfig.json ./

# Install typescript and tsx to run the server
RUN npm install -g tsx typescript

# Copy the built frontend from the previous stage to a 'dist' folder
COPY --from=build-frontend /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Run the backend server
CMD ["tsx", "server.ts"]
