# HTTP/2 examples

- HTTP/2 load with server push
  Loads 128 patches of an image. 
  Inspired by https://http1.golang.org/gophertiles?latency=0 where you can compare the http/1 version vs. http2 version in Golang

# IMPORTANT SECURITY NOTE: 

HTTP/2 requires TLS. To make it easy to try, the repo contains certificate and key for the server.

***DO NOT USE THOSE cert and key for your own project if you will be making use of this code, since they are published here, that would defeat the purpose of TLS.***

For each sub-folder, build the client code with `yarn build` in the client folder
and start the server with `yarn start` in the server folder