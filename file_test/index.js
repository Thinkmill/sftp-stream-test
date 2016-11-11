const fs = require('fs');
const request = require('request');
const streamEqual = require('stream-equal');

const server = require('./ftpServer');

const Client = require('ssh2-sftp-client');
const client = new Client();

const config = require('./config');

console.log('================================');
console.log('File Test');
console.log('================================');

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
let sftpStream;
let sftpPromise = client.connect({
    host: 'localhost',
    port: config.PORT,
    username: config.USERNAME,
    password: config.PASSWORD,
}).then(() => {
    return client.get(config.IMAGE_PATH);
}).then((stream) => {
    return new Promise((resolve, reject) => {
        sftpStream = stream;
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