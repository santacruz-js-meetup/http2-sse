// Require needed modules and initialize Express app
const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');
const { v4: uuidv4 } = require('uuid');

// const { Worker, isMainThread, parentPort } = require('worker_threads');

// if (isMainThread) {
//   const worker = new Worker(__filename);
//   worker.once('message', (message) => {
//     console.log(message);  // Prints 'Hello, world!'.
//   });
//   worker.postMessage('Hello, world!');
// } else {
//   // When a message from the parent thread is received, send it back:
//   parentPort.once('message', (message) => {
//     parentPort.postMessage(message);
//   });
// }


const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_METHOD,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  ERR_HTTP2_STREAM_ERROR,
  NGHTTP2_REFUSED_STREAM,
} = http2.constants;

const { Worker } = require('worker_threads');

function runService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__dirname + '/service.js', { workerData });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  })
}

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
    let files = fs.readdirSync(__dirname + "/../client/build/static/css");
    for (let i = 0; i < files.length; i++) {
      const fileName = __dirname + "/../client/build/static/css/" + files[i];
      const path = "/static/css/" + files[i];
      pushFile(res.stream, path, fileName);
    }
    files = fs.readdirSync(__dirname + "/../client/build/static/js");
    for (let i = 0; i < files.length; i++) {
      const fileName = __dirname + "/../client/build/static/js/" + files[i];
      const path = "/static/js/" + files[i];
      pushFile(res.stream, path, fileName);
    }
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

// Middleware for GET /events endpoint
function dataHandler(req, res, next) {
  // Mandatory headers and http status to keep connection open
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  // After client opens connection send all reqs as string
  // Generate an id and save res
  // object of client connection on clients list
  // Later we'll iterate it and send updates to each client

  const clientId = uuidv4(); // Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);
  // on first call return the all registered requests.
  res.write(`data: ${JSON.stringify(reqs)}\n\n`);

  // When client closes connection we update the clients list
  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(c => c.id !== clientId);
  });
}

// Iterate clients list and use write res object method to send new req
function sendEventsToAll(newReq) {
  clients.forEach(c => c.res.write(`data: ${JSON.stringify([newReq])}\n\n`))
}

function keepAliveAll() {
  // : is a comment
  clients.forEach(c => c.res.write(`:data\n\n`))
}

setInterval(() => keepAliveAll(), 60000);

// Middleware for POST /job endpoint
async function addReq(req, res, next) {

  let data = '';
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', async () => {
    // console.log(`\n${data}`);
    const newReq = JSON.parse(data);

    reqs.push(newReq);
    // Send recently added req as POST result
    const headers = {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };

    res.stream.respond({ ":status": 200 });
    res.stream.write(`Starting long running job\n`);

    // Invoke iterate and send function to notify all clients
    sendEventsToAll(newReq);

    // Send another chunk later
    setTimeout(() => {
      res.stream.end(`All done\n`);
    }, 5000);    
    
    return   
  });
}

// handle requests
const handlers = (req, res) => {
  if (req.url === "/") {
    staticHandler(req, res);
  } else if (req.url === "/favicon.ico") {
    res.stream.respond({ ":status": 200 });
    res.stream.end();
  } else if (req.url === "/events") {
    return dataHandler(req, res);
  } else if (req.url === "/job") {
    return addReq(req, res);
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