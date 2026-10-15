FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY src/ /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O- http://127.0.0.1/health || exit 1

EXPOSE 80
