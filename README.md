# HTTP/2 examples

- HTTP/2 load with server push
- HTTP/2 + Server Sent Events 
  - Example of HTTP/2 with Server sent event, broadcasting to all clients.
  - includes also an example of sending data in chunks in the same call, in immediate response for the call and after a defined elapsed time, to simulate a call to an async job that returns data after some time, without the need for pinging the erver back over and over until the data is available.

For each sub-folder:
- build the client code with `yarn build` in the client folder
- start the server with `yarn start` in the server folder
- go to https://localhost:3000/

# IMPORTANT SECURITY NOTE: 

HTTP/2 requires TLS. To make it easy to try, the repo contains certificate and key for the server.

***DO NOT USE THOSE cert and key for your own project if you will be making use of this code, since they are published here, that would defeat the purpose of TLS.***


The presentation slides are here:

https://docs.google.com/presentation/d/1MzE_c2clxo4IcE6_pNvOmLmX1maI1IsS5IUOBApVHYY/edit?usp=sharing
