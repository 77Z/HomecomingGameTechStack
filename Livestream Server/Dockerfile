# LABEL maintainer="Vince R <vince@77z.dev>"

FROM ubuntu:14.04 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpcre3 \
    libpcre3-dev \
    libssl-dev \
    wget \
    unzip \
    zlib1g-dev

RUN wget http://nginx.org/download/nginx-1.15.1.tar.gz

RUN wget https://github.com/sergey-dryabzhinsky/nginx-rtmp-module/archive/dev.zip

RUN tar -zxvf nginx-1.15.1.tar.gz

RUN unzip dev.zip

WORKDIR /app/nginx-1.15.1

RUN ./configure --with-http_ssl_module --add-module=../nginx-rtmp-module-dev

RUN make && make install

FROM ubuntu:14.04

COPY --from=builder /usr/local/nginx /usr/local/nginx

WORKDIR /usr/local/nginx

COPY nginx.conf /usr/local/nginx/conf/nginx.conf

CMD ["sbin/nginx", "-g", "daemon off;"]

EXPOSE 1935