#!/bin/bash
cd /home
git clone https://github.com/widecastlive/nginxffmpeg.git
cd nginxffmpeg/
mkdir hls && chown -R 2001:2000 hls