# chromeapp-ws

chromeapp-ws is an implementation of the [WebSocket protocol](https://tools.ietf.org/html/rfc6455) for running a 
WebSocket server in a [chrome application](https://developer.chrome.com/apps), allowing for fast, bidirectional 
communication between a web page and a chrome app. 

### Usage

Make sure that Node.js and Webpack is installed on your machine.

Install dependencies:

    npm install 
    
Build the source:

    webpack
    
This will transpile the project's ES6 code to ES5 and put the resulting bundle in `dist/build/bundle.js`.

The `dist` directory contains the chrome app to be installed in the browser. Customize the sample manifest file
according to your own needs (the resulting manifest file must be named `manifest.json`).

The following code shows how to communicate with the chrome app from a web page:

    // implicitly launch the installed chrome app by sending it a message. Note that the current page location
    // must match the domain specified as "externally_connectable" in your manifest.json.
    chrome.runtime.sendMessage(
        '<applicationId>', // your app ID
        {},
        function(response) {
            // if a response is given, the app has been launched and initialized.
            var ws = new WebSocket('ws://127.0.0.1:' + response.port + '/ws');
            ws.onopen = function() {
                ws.send('Hello');
                ws.send(JSON.stringify({ text: 'World' }));
            };
            ws.onmessage = function(e) {
                console.log(e.data);
            };
        }

To get started with WebSocket messaging in your chrome app, see `src/appMessageHandler.js`.

### License

The MIT License (MIT)

Copyright (c) 2016 Marc Klefter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.