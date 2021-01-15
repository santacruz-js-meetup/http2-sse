# HTTP/2 + Server Sent Events 
  
  Example of HTTP/2 with Server sent event, broadcasting to all clients.

  Also includes an example of sending data in chunks in the same call, in immediate response for the call and after a defined elapsed time, to simulate a call to an async job that returns data after some time, without the need for pinging the erver back over and over until the data is available.

# IMPORTANT SECURITY NOTE: 

HTTP/2 requires TLS. To make it easy to try, the repo contains certificate and key for the server.

***DO NOT USE THOSE cert and key for your own project if you will be making use of this code, since they are published here, that would defeat the purpose of TLS.***

For each sub-folder, build the client code with `yarn build` in the client folder
and start the server with `yarn start` in the server folder