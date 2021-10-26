#!/bin/bash
cd /home
git clone https://github.com/mhojnik/srt2hls.git
cd srt2hls/
mkdir hls && chown -R 2001:2000 hls