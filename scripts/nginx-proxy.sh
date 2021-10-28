#!/bin/bash
apt install snapd;
snap install core; snap refresh core;
snap install --classic certbot;
ln -s /snap/bin/certbot /usr/bin/certbot;
certbot certonly -n -d $domain -m $email --agree-tos --standalone;

cd /home;
git clone https://github.com/widecastlive/nginx-proxy.git;