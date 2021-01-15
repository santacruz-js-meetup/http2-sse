// Require needed modules and initialize Express app
const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_METHOD,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  ERR_HTTP2_STREAM_ERROR,
  NGHTTP2_REFUSED_STREAM,
} = http2.constants;

// read and send file content in the stream
const sendFile = (stream, fileName) => {
  const fd = fs.openSync(fileName, "r");
  const stat = fs.fstatSync(fd);
  const headers = {
    "content-length": stat.size,
    "last-modified": stat.mtime.toUTCString(),
    "content-type": mime.getType(fileName)
  };
  stream.on("close", () => {
    // console.log("closing file", fileName);
    fs.closeSync(fd);
  });
  stream.on('error', (err) => {
    console.log('pushStream.on error', err);
    const isRefusedStream = err.code === ERR_HTTP2_STREAM_ERROR &&
    stream.rstCode === NGHTTP2_REFUSED_STREAM;
    if (isRefusedStream)  {
        return;
    }
  });
  stream.respondWithFD(fd, headers);
  stream.end();
};

const pushFile = (stream, path, fileName) => {
  stream.pushStream({ ":path": path }, (err, pushStream) => {
    if (err) {
      // throw err;
      console.warn(err);
    }
    sendFile(pushStream, fileName);
  });
};

const staticHandler = (req, res) => {
    files = fs.readdirSync(__dirname + "/../client/build/static/media");
    for (let i = 0; i < files.length; i++) {
      const fileName = __dirname + "/../client/build/static/media/" + files[i];
      const path = "/static/media/" + files[i];
      pushFile(res.stream, path, fileName);
    }
    // lastly send index.html file
    const filePath = __dirname + "/../client/build/index.html";
    sendFile(res.stream, filePath, "index.html");
};


// handle requests
const handlers = (req, res) => {
  if (req.url === "/") {
    staticHandler(req, res);
  } else if (req.url === "/favicon.ico") {
    res.stream.respond({ ":status": 200 });
    res.stream.end();
  } else {
    const path = __dirname + "/../client/build" + req.url;
    sendFile(res.stream, path, req.url);
  }
};

const PORT = 3000;
let clients = [];
let reqs = [];

const serverOptions = {
   key: fs.readFileSync(__dirname + "/certs/key.pem"),
   cert: fs.readFileSync(__dirname + "/certs/cert.pem")
};
http2.createSecureServer(serverOptions, handlers).listen(PORT, 'localhost', () => {
   console.log(`HTTP/2 running at https://localhost:${PORT}`)
});