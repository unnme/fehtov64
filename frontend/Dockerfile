# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20 AS build-stage

WORKDIR /app

# Set environment variables to avoid postinstall issues
ENV npm_config_cache=/tmp/.npm
ENV npm_config_prefer_offline=false
ENV npm_config_audit=false
ENV npm_config_fund=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package*.json package-lock.json* /app/

# Clean install with proper error handling
# Using npm ci if package-lock.json exists, otherwise npm install
RUN npm cache clean --force && \
    if [ -f package-lock.json ]; then \
        npm ci --legacy-peer-deps; \
    else \
        npm install --legacy-peer-deps; \
    fi

COPY ./ /app/

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Generate OpenAPI client automatically via prebuild hook before build
RUN npm run build


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
