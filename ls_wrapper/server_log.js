const net = require('net');
const { spawn } = require('child_process');

const server = net.createServer(socket => {
  console.log('Client connected');

  // Start the "uvl" program in a new child process
  const childProcess = spawn('./uvls');

  // Log incoming and outgoing messages
  socket.on('data', data => {
    console.log(`Received: ${data.toString()}`);
    // Send data from the socket to the child process's stdin
    childProcess.stdin.write(data);
  });

  childProcess.stdout.on('data', data => {
    console.log(`Sending back: ${data.toString()}`);
    // Send data from the child process's stdout back to the socket
    socket.write(data);
  });

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
