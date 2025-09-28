#!/usr/bin/env bash

openssl req -x509 -newkey rsa:4096 -nodes -keyout private.key -out public.crt
