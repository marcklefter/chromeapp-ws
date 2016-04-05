
import {appSockets} from '../../appSockets';
import {dispatcher} from './dispatcher';

let HttpdFactory = (() => {
    
    const
        EPHEMERAL_PORT_MIN = 49152,
		EPHEMERAL_PORT_MAX = 65535;
    
    let 
        serverSocket,
        serverPort,
        
        clientSockets = [],
        
        _listen = (resolve, reject) => {
            
            let port = Math.floor(Math.random() * (EPHEMERAL_PORT_MAX - EPHEMERAL_PORT_MIN + 1) + EPHEMERAL_PORT_MIN);
            
            chrome.sockets.tcpServer.listen(
                serverSocket,
                '0.0.0.0',
                port,
                (result) => {
                    if (result < 0) return reject();
                    
                    serverPort = port;
                    
                    // ...
                    
                    dispatcher.onSocketClose((socket) => {
                        let removed = clientSockets.splice(clientSockets.indexOf(socket), 1);
                        removed.length !== 0 && chrome.sockets.tcp.close(socket); 
                    });
                    
                    // register socket handlers for HTTP client requests.
                    appSockets.register(
                        'tcp',
                        'httpd',
                        (info) => {
                            // onReceive.
                            dispatcher.dispatch(info.socketId, info.data);
                        },
                        (info) => {
                            console.log(info);
                            // onReceiveError.
                            dispatcher.close(info.socketId);
                        }
                    );
                    
                    chrome.sockets.tcpServer.onAccept.addListener((info) => {
                         clientSockets.push(info.clientSocketId);
                         
                         // ensure that HTTP client requests are to be dispatched to the previously registered 
                         // socket handler.
                         chrome.sockets.tcp.update(info.clientSocketId, { name: 'httpd' });
                         
                         chrome.sockets.tcp.setPaused(info.clientSocketId, false);
                    });
                    
                    // ...
                    
                    resolve();
                }
            );
        };
    
    // ...
    
    return class Httpd {
        
        constructor()
        {
            // ...
        }
        
        listen()
        {
            return new Promise((resolve, reject) => {
                chrome.sockets.tcpServer.create(
                    {},
                    (createInfo) => {
                        serverSocket = createInfo.socketId;
                        
                        _listen(resolve, reject);
                    }
                ) 
            });
        }
        
        close()
        {
            clientSockets.forEach((socket) => {
                // delegate to dispatcher to close socket.
                dispatcher.close(socket); 
            });
        }
        
        get port() { return serverPort; } 
    };
})();

// ... 

export let httpd = new HttpdFactory();