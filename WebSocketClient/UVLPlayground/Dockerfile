# Use an official Nginx runtime as the base image
FROM nginx:latest

# Copy your static files into the Nginx document root directory
COPY dist /usr/share/nginx/html
COPY node_modules /usr/share/nginx/html/node_modules

# Optional: Copy a custom Nginx configuration file
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for HTTP traffic (Nginx's default port)
# EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]