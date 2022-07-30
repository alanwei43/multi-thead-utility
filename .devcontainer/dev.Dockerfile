FROM node:16

COPY ./.devcontainer/sources.list /etc/apt/sources.list

ARG USERNAME=node

RUN apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

WORKDIR /data
RUN chown -R $USERNAME /data
USER $USERNAME

RUN echo "\nalias ll=\"ls -alh\"" >> ~/.bashrc