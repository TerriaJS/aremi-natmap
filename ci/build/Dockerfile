FROM alpine:3.5

RUN apk update
RUN apk add alpine-sdk git libffi-dev musl-dev openssl-dev perl py-pip python python-dev sshpass

RUN pip install --upgrade pip
RUN pip install git+git://github.com/ansible/ansible.git

RUN wget https://releases.hashicorp.com/packer/0.12.2/packer_0.12.2_linux_amd64.zip
RUN unzip packer_0.12.2_linux_amd64.zip -d /usr/bin/

RUN pip install awscli

RUN apk add jq

RUN apk add tzdata
RUN cp /usr/share/zoneinfo/Australia/Canberra /etc/localtime

