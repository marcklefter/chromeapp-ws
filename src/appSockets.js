
let AppSocketsFactory = (() => {
        
    let socketRegistry = {
        tcp: {}
    };
    
    // ...
    
    return class AppSockets {
        
        constructor()
        {
            chrome.sockets.tcp.onReceive.addListener((info) => {
                chrome.sockets.tcp.getInfo(
                    info.socketId,
                    (socketInfo) => {
                        socketRegistry.tcp[socketInfo.name].onReceive(info);    
                    }
                );
            });
            
            chrome.sockets.tcp.onReceiveError.addListener((info) => {
                chrome.sockets.tcp.getInfo(
                    info.socketId,
                    (socketInfo) => {
                        socketRegistry.tcp[socketInfo.name].onReceiveError(info);      
                    }
                );
            });
        }
        
        register(protocolType, target, onReceive, onReceiveError)
        {
            socketRegistry[protocolType][target] = {};
            socketRegistry[protocolType][target].onReceive = onReceive;
            socketRegistry[protocolType][target].onReceiveError = onReceiveError;    
        }
    }; 
})();  
  
export let appSockets = new AppSocketsFactory();