#!/bin/bash
apt install snapd;
snap install core; snap refresh core;
snap install --classic certbot;
ln -s /snap/bin/certbot /usr/bin/certbot;
certbot certonly -n --agree-tos --standalone -m $1 -d $2;

cd /home;
git clone https://github.com/widecastlive/nginx-proxy.git;