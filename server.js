var http = require("http");

var server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });

  if (req.url === "/api/health") {
    res.end(
      JSON.stringify({
        status: "OK",
        message: "ArchTrack Server is running",
        timestamp: new Date().toISOString(),
      }),
    );
  } else {
    res.end(
      JSON.stringify({
        message: "ArchTrack API Server",
        status: "running",
        url: req.url,
      }),
    );
  }
});

var PORT = process.env.PORT || 3000;
var HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, function () {
  console.log("Server running on " + HOST + ":" + PORT);
  console.log("Environment: " + (process.env.NODE_ENV || "development"));
  console.log("All environment variables:");
  console.log(JSON.stringify(process.env, null, 2));
});
