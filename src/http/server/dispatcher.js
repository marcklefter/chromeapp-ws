
import {HttpIO} from '../io';
import {routes} from './routes';

let DispatcherFactory = (() => {
    
    let 
        _onSocketClose,
    
        dispatchers = [],
        
        // helper objects for parsing request and writing response messages.
        httpReq = HttpIO.Request(),
        httpRes = HttpIO.Response(),
        
        // returns a helper object facilitating the creation of response messages.
        // The returned object may be used as follows:
        // 
        // res.status(200).set('Content-Type', 'application/json').send({...});
        httpResponseMaker = (dispatcherInstance, socket) => {
            
            let 
                messageObject = {},
                responseSent;
                
            // ...
            
            let instance = {};
            
            instance.status = (statusCode) => {
                messageObject.statusCode = statusCode;
                
                return instance;
            };
            
            instance.set = (header, value) => {
                messageObject.headers = messageObject.headers || {};
                messageObject.headers[header] = value;
                
                return instance;
            };
            
            instance.send = (body) => {
                if (!responseSent)
                {
                    messageObject.body = body;
                    
                    chrome.sockets.tcp.send(
                        socket,
                        httpRes.write(messageObject),
                        (sendInfo) => {
                            if (!sendInfo || sendInfo.resultCode < 0)
                            {
                                dispatcherInstance.close(socket);
                            }
                        }
                    );  
                    
                    responseSent = true;
                }
            };
            
            return instance;
        };
    
    return class Dispatcher{
        
        constructor()
        {
            // ...   
        }
        
        dispatch(socket, data)
        {
            // an incoming HTTP request is either handled by a specific dispatcher or routed to a regular HTTP request 
            // handler. E.g., when a WebSocket connection is established, the client handshake is routed to a handler 
            // which performs the server handshake and registers a WebSocket protocol dispatcher that will handle 
            // future WebSocket messages.
            dispatchers[socket]
                ? dispatchers[socket].onData(data)
                : routes.route(
                    httpReq.parse(data),
                    httpResponseMaker(this, socket),
                    
                    // context object
                    {
                        socket: socket
                    }
                );
        }
        
        register(socket, dispatcher)
        {
            dispatchers[socket] = dispatcher;
        }
        
        /** Registers a callback to invoke when a socket is closed by the HTTP server (see server.js) */
        onSocketClose(callback)
        {
            _onSocketClose = callback;
        }
        
        close(socket)
        {
            // if a specific dispatcher has been registered for the socket, close and delete it.
            let dispatcher = dispatchers[socket];
            if (dispatcher)
            {
                dispatcher.onClose();
                delete dispatchers[socket];
            }
            
            // complete the socket close.
            _onSocketClose(socket);
        }
    };
})();

export let dispatcher = new DispatcherFactory();