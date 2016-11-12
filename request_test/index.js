const exec = require('child_process').exec;
const fs = require('fs');
const request = require('request');

const server = require('./ftpServer');
const config = require('./config');

console.log('================================');
console.log('Request Test');
console.log('================================')

server.create();
server.start();

// Download the cat directly with request:
if (fs.existsSync('request_kitten.jpg')) {
    fs.unlinkSync('request_kitten.jpg');
}
let localFile = fs.createWriteStream('request_kitten.jpg');

console.log('Downloading kitten directly with request.');
let requestStream;
let requestPromise = new Promise((resolve, reject) => {
    request
        .get(config.IMAGE_URL)
        .on('response', (response) => {
            response.pipe(localFile);
        });
    
    localFile.on('close', resolve);
});

// Download from SFTP (piped via request):
console.log('Downloading kitten from SFTP');
if (fs.existsSync('sftp_kitten.jpg')) {
    fs.unlinkSync('sftp_kitten.jpg');
}
				
let sftpStream;
let sftpPromise = new Promise((resolve, reject) => {
    exec('sftp -P 7007 -b request_test/batch.sftp localhost', (error, stdout, stderr) => {
        console.log('stdout: ', stdout);
        console.error('stderr: ', stderr);
        sftpStream = fs.createReadStream('kitten.jpg');

        resolve();
    });
});

Promise.all([requestPromise, sftpPromise]).then(() => {
    console.log('Downloaded both.');
    process.exit(0);
});