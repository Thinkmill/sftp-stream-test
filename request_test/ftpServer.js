const request = require('request');
const path = require('path');
const SFTPServer = require('node-sftp-server');
const config = require('./config');

class FtpServer {
	create () {
		this.server = new SFTPServer('test_key');

		this.server.on('connect', this.onConnect.bind(this));
		this.server.on('end', this.onEnd.bind(this));
	}

	start () {
		this.server.listen(config.PORT);

		console.log(`SFTP server started on port ${config.PORT}`);
	}

	onConnect (auth) {
		console.log(`SFTP Authentication attempted. Method: ${auth.method} User: ${auth.username}`);

		// Open server up to everyone.
        return auth.accept(this.onSession.bind(this));
	}

	onSession (session) {
		console.log('SFTP client successfully authenticated.');

		session.on('realpath', (requestedPath, callback) => {
			callback(path.resolve('/', requestedPath));
		});

		session.on('readdir', (path, responder) => {
			console.log(`SFTP readdir request on path ${path}`);

            let index = 0;
            const result = [config.IMAGE_PATH.replace('/', '')];

            responder.on('dir', () => {
                if (index < result.length) {
                    responder.file(result[index++]);
                } else {
                    responder.end();
                }
            });

            responder.on('end', () => {
                console.log('SFTP directory listing finished.');
            });
		});

		session.on('stat', (path, statkind, stat) => {
			console.log(`SFTP user is statting a file at path: ${path}`);

            if (path === config.IMAGE_PATH) {
                stat.is_file();
				stat.permissions = 420; // This is 644 in octal, e.g. permissions of rw-r--r--.
                stat.size = 43399800000000;
				stat.uid = 1;
				stat.gid = 1;
				stat.atime = 123456;
				stat.mtype = 123456;
                stat.file();
            } else {
                return stat.nofile();
            }
		});

		session.on('readfile', (filePath, writestream) => {
			console.log(`SFTP user is attempting to read file at path: ${filePath}`);

            if (filePath === config.IMAGE_PATH) {
                request(config.IMAGE_URL).pipe(writestream);
            }
		});

		session.on('error', (error) => {
			console.error(`SFTP Error during session: ${error.message}`);
		});
	}

	onEnd () {
		console.log('SFTP user disconnected from server.');
	}
}

module.exports = new FtpServer();
