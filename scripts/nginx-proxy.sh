#!/bin/bash
apt install snapd -y;
snap install core; snap refresh core;
snap install --classic certbot;
ln -s /snap/bin/certbot /usr/bin/certbot;
certbot certonly -n --agree-tos --standalone -m $2 -d $1;

cd /home;
git clone https://github.com/widecastlive/nginx-proxy.git;

export DOMAIN="$1";
envsubst '${DOMAIN}' < /home/nginx-proxy/conf/nginx.template.conf > /home/nginx-proxy/conf/nginx.conf;