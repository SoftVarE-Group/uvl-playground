FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install Nginx
RUN apt-get update \
    && apt-get install -y nginx \
    && apt-get clean

# Copy your static files into the Nginx document root directory
RUN cp -r dist/* /var/www/html/
RUN cp -r node_modules /var/www/html

# Optional: Copy a custom Nginx configuration file
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for HTTP traffic (Nginx's default port)
#EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]