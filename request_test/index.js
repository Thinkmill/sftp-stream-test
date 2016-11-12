const exec = require('child_process').exec;
const fs = require('fs');
const request = require('request');
const streamEqual = require('stream-equal');

const server = require('./ftpServer');
const config = require('./config');

console.log('================================');
console.log('Request Test');
console.log('================================')

server.create();
server.start();

// Download the cat directly with request:
console.log('Downloading kitten directly with request.');
let requestStream;
let requestPromise = new Promise((resolve, reject) => {
    request
        .get(config.IMAGE_URL)
        .on('response', (response) => {
            requestStream = response;
            resolve();
        });
});

// Download from SFTP (piped via request):
console.log('Downloading kitten from SFTP');
if (fs.existsSync('kitten.jpg')) {
    fs.unlinkSync('kitten.jpg');
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

// Compare
Promise.all([requestPromise, sftpPromise]).then(() => {
    streamEqual(sftpStream, requestStream, (err, equal) => {
        if (err) console.log('Error: ' + JSON.stringify(err));

        console.log(equal ? 'SUCCESS' : 'FAIL, streams are not equal.');
        process.exit(0);
    });
});