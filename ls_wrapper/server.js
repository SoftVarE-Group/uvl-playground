const net = require('net');
const { spawn } = require('child_process');

const server = net.createServer(socket => {
  console.log('Client connected');

  // Start the "uvl" program in a new child process
  const childProcess = spawn('./uvls');

  // Pipe data from the socket to the child process's stdin
  socket.pipe(childProcess.stdin);

  // Pipe data from the child process's stdout back to the socket
  childProcess.stdout.pipe(socket);

  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected');
    // Terminate the child process when the socket is closed
    childProcess.kill();
  });

  // Handle errors
  socket.on('error', err => {
    console.error('Socket error:', err);
  });

  // Handle child process errors
  childProcess.on('error', err => {
    console.error('Child process error:', err);
  });
});

const PORT = 8080; // Change this to your desired port number
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
