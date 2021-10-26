#!/bin/bash
cd /home
git clone https://github.com/widecastlive/liquidsoap-hls.git
cd liquidsoap-hls/
mkdir hls && chown -R 2001:2000 hls