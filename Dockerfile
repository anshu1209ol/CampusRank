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

# Copy backend and data files
COPY server.ts ./
COPY tsconfig.json ./
COPY problems.json ./

# Install typescript, tsx, and docker CLI (so the server can spawn code execution containers)
RUN apk add --no-cache docker-cli
RUN npm install -g tsx typescript

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Copy the built frontend from the previous stage to a 'dist' folder
COPY --from=build-frontend /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000


# Run the backend server
CMD ["tsx", "server.ts"]
