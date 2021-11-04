#!/bin/bash
cd /home
git clone https://github.com/widecastlive/liquidsoap-hls.git
cd liquidsoap-hls/
mkdir hls && chown -R 10000:10001 ./hls