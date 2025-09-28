# Don't mess this up

# Tailscale for iPs??

### Docker setup

```bash
docker pull ghcr.io/77z/streamserver:latest
docker run -it -p 1935:1935 --rm streamserver:latest
```

IRL Pro on android...

setup a connection with no auth
```
rtmp://<server ip>:1935/live/test
```

VLC on desktop...

Ctrl+N or open new network stream

```
rtmp://<server ip>:1935/live/test
```
