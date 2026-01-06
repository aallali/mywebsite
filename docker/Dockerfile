FROM node:20-alpine AS builder

WORKDIR /app

COPY src/package*.json ./src/
RUN cd src && npm install
COPY . .
RUN cd src && npm run build

FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3013

CMD ["nginx", "-g", "daemon off;"]
