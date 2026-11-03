# Use the same non-root Nginx runtime as the OpenShift Deployment.
FROM docker.io/nginx/nginx-unprivileged:stable-alpine

COPY site/ /usr/share/nginx/html/
EXPOSE 8080
