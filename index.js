const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url'); // For parsing URL query parameters if needed, though not strictly for this POST

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const USERS_FILE = path.join(__dirname, 'users.json');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

function serveStaticFile(req, res) {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(PUBLIC_DIR, url);

    // Prevent path traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`500 Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

function handleSignup(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });

    req.on('end', () => {
        try {
            const newUser = JSON.parse(body);
            

            fs.readFile(USERS_FILE, 'utf8', (err, data) => {
                let users = [];
                if (!err && data) {
                    try {
                        users = JSON.parse(data);
                    } catch (parseError) {
                        console.error('Error parsing users.json:', parseError);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ message: 'Error processing user data (parse).' }));
                    }
                } else if (err && err.code !== 'ENOENT') { // ENOENT is fine (file doesn't exist yet)
                    console.error('Error reading users.json:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ message: 'Error processing user data (read).' }));
                }

                // Check if user already exists (optional, good practice)
                if (users.some(user => user.username === newUser.username || user.email === newUser.email)) {
                    res.writeHead(409, { 'Content-Type': 'application/json' }); // 409 Conflict
                    return res.end(JSON.stringify({ message: 'Username or email already exists.' }));
                }

                users.push(newUser);

                fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to users.json:', writeErr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ message: 'Could not save user.' }));
                    }
                    res.writeHead(201, { 'Content-Type': 'application/json' }); // 201 Created
                    res.end(JSON.stringify({ message: 'User signed up successfully!', user: { username: newUser.username, email: newUser.email } }));
                });
            });
        } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            res.writeHead(400, { 'Content-Type': 'application/json' }); // Bad Request
            res.end(JSON.stringify({ message: 'Invalid JSON payload.' }));
        }
    });

    req.on('error', (err) => {
        console.error('Request error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server request error.' }));
    });
}


const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`); // Base URL is required for URL object

    if (req.method === 'POST' && parsedUrl.pathname === '/signup') {
        handleSignup(req, res);
    } else if (req.method === 'GET') {
        serveStaticFile(req, res);
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' }); // Method Not Allowed
        res.end(`${req.method} not allowed for ${req.url}`);
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    // Create users.json if it doesn't exist
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, '[]', 'utf8');
        console.log(`${USERS_FILE} created.`);
    }
});