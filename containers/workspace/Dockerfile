#############################################
# go workspace
#############################################
FROM node:22.23.4-bookworm-slim AS node-toolchain
FROM debian:12-slim AS node-runtime

RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 libstdc++6 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node-toolchain /usr/local/bin/node /usr/local/bin/node
COPY --from=node-toolchain /usr/local/lib/node_modules/ /usr/local/lib/node_modules/
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && ln -s ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack

FROM node-runtime AS workspace

ARG PUID=1000
ENV PUID ${PUID}
ARG PGID=1000
ENV PGID ${PGID}

ENV GO_VERSION 1.23.5

RUN apt-get update -yqq && \
    groupadd -g ${PGID} go && \
    useradd -u ${PUID} -g go -m go -G go && \
    usermod -p "*" go

#############################################
# install dependencies
#############################################
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    tree \
    jq \
    inetutils-ping \
    redis-tools \
    wget \
    cron \
    procps \
    make \
    sudo \
    inotify-tools \
    mariadb-client \
    zip \
    unzip \
    default-jre \
 && rm -rf /var/lib/apt/lists/*

#############################################
# install go
#############################################
ENV GO_VERSION 1.24.2
RUN cd /tmp && wget --quiet https://golang.org/dl/go${GO_VERSION}.linux-$(dpkg --print-architecture).tar.gz \
	&& tar -C /usr/local -xzf go${GO_VERSION}.linux-$(dpkg --print-architecture).tar.gz && rm -rf /tmp/*

#######################################################################
# setup
#######################################################################
RUN echo "go ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/user && \
    chmod 0440 /etc/sudoers.d/user

#############################################
# set go env vars
# https://golang.org/doc/code.html
#############################################
ENV GOPATH=/home/go
ENV GOROOT=/usr/local/go/
ENV PATH=$PATH:/usr/local/go/bin:$GOPATH/bin
ENV CGO_ENABLED 0

#######################################################################
# default shell
#######################################################################
RUN chsh -s /bin/bash go

#############################################
# download migrate utility (migrations)
#############################################
RUN mkdir -p /tmp/ && chmod 1777 /tmp && wget --quiet https://github.com/golang-migrate/migrate/releases/download/v4.12.2/migrate.linux-amd64.tar.gz \
    && tar -xvf migrate.linux-amd64.tar.gz -C /tmp/ \
    && mv /tmp/migrate.linux-amd64 /bin/migrate \
    && chmod +x /bin/migrate

USER go

#############################################
# download go utilities
# air   - Go project hot reload
# packr - Pack filesystem into go binary
#############################################
RUN go install github.com/air-verse/air@latest
RUN go install github.com/gobuffalo/packr/packr@v1.30.1
RUN go install github.com/swaggo/swag/cmd/swag@v1.8.5
RUN go install github.com/google/wire/cmd/wire@latest

#######################################################################
# node
#######################################################################
RUN sudo apt-get update && sudo apt-get install -y curl sudo gnupg \
    && sudo rm -rf /var/lib/apt/lists/*

RUN sudo npm install -g gh-release
RUN sudo npm install @openapitools/openapi-generator-cli -g

#############################################
# bash
#############################################
ENV PS1 '\[\e]0;\w\a\]\n\[\e[32m\]\u@\h \[\e[33m\]\w\[\e[0m\]\n\$ '

COPY --chown=go:go .bash_aliases /home/go/.bashrc
COPY --chown=go:go .bash_aliases /root/.bashrc
COPY --chown=go:go terminal-help.sh /opt/terminal-help.sh
RUN chmod +x /opt/terminal-help.sh

WORKDIR /home/go/src
