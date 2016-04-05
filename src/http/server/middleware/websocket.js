
import CryptoJS     from 'crypto-js';

import {HttpUtil}   from '../../util';
import {dispatcher} from '../dispatcher';

// ...

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

let WebSocketDispatcher = (socket, messageHandler) => {

    let 
        fragmentedMessage,
        fragmentedMessageType,
        
        // ...
        
        // sends keep-alive messages to the client.
        heartbeat = (() => {
            let
                interval,

                // ...

                start = () => {
                    interval = setInterval(() => {
                        send(0x9);
                    }, 5 * 1000)
                },
                        
                clear = () => {
                    clearInterval(interval);
                };
                    
            // ...

            return {
                start: start,
                clear: clear
            };
        })(),
         
        // ...
         
        // note: 'message' MUST be either of type string (default) or an instance of ArrayBuffer.
        send = (opCode, message = '') => {
            let 
                messageLength,

                payloadLength,
                payloadOffset
                    = 2,
                    
                buffer,
                view;

            // ...
            
            messageLength = typeof message === 'string' 
                ? message.length 
                : (message instanceof ArrayBuffer ? message.byteLength : null);
                
            if (!messageLength) return;
            
            // ...

            payloadLength 
                = messageLength > 65535 ? 8 : (messageLength > 125 ? 2 : 0);

            payloadOffset
                += payloadLength;

            buffer
                = new ArrayBuffer(2 + payloadLength + messageLength);

            view
                = new Uint8Array(buffer);

            // ...

            view[0]
                = 0x80 | opCode;

            view[1]
                = messageLength > 65535 ? 127 : (messageLength > 125 ? 126 : messageLength);

            for (let i = payloadLength - 1, len = messageLength; i >= 0; i--)
            {
                view[2 + i]  = len & 0xFF;
                len = len >> 8;
            }

            // ...
            
            let messageIterator = typeof message === 'string' 
                ? (i) => { return message.charCodeAt(i); }
                : ((message) => {
                    let view = new Uint8Array(message);
                    
                    return (i) => {
                        return view[i];
                    };
                    
                })(message);

            for (let i = 0; i < messageLength; i++)
            {
                view[payloadOffset + i] = messageIterator(i);
            }

            // ...

            let _send = () => {
                chrome.sockets.tcp.send(
                    socket, 
                    view.buffer,
                    function(sendInfo)
                    {
                        if (!sendInfo || sendInfo.resultCode < 0)
                        {
                            dispatcher.close(socket);
                        }
                    }
                );
            };

            opCode === 0x8 ? _send() : (chrome.runtime.lastError ? dispatcher.close() : _send());
        },
        
        transformApplicationData = (opCode, applicationData) => {
            
            if (opCode == 0x1)  
            {
                return HttpUtil.arrayBufferToString(applicationData);
            }    
            
            return applicationData;
        },
        
        // helper function to send text or binary messages to clients.
        sendFn = (message) => {
            
            if (typeof message === 'string')
            {
                send(0x1, message);
            }
            else if (message instanceof ArrayBuffer)
            {
                send(0x2, message);
            }
            else
            {
                console.log('Message to send is not text or binary');
            }
        };
        
    // ...
    
    heartbeat.start();
        
    // the dispatcher object to register.
    return {
        
        // this function parses a single WebSocket frame. Upon having read a complete message, it calls the provided
        // message handler.
        onData: function(data) {
            let 
                buffer 
                    = new Uint8Array(data),
                
                bufferLength
                    = buffer.length,
                
                frame
                    = {},
                
                payload,
                applicationData;
                
            // ...
            
            let that = this;
            
            // parse the FIN bit, opcode and payload length.
            
            frame.FIN
                = (buffer[0] & 0xFF) >> 7;

            frame.opCode
                = buffer[0] & 0x0F;

            frame.payloadLength
                = buffer[1] & 0x7F;
                
            switch (frame.payloadLength)
            {
                case 126:

                    frame.payloadLength
                        = (buffer[2] << 8) + buffer[3];

                    frame.mask
                        = buffer.subarray(4, 8);

                    frame.payloadOffset
                        = 8;

                    break;

                case 127:

                    frame.payloadLength = 0;

                    for (let i = 0; i < 8; i++)
                    {
                        frame.payloadLength += (frame.payloadLength << 8) + buffer[2 + i];
                    }

                    frame.mask
                        = buffer.subarray(10, 14);

                    frame.payloadOffset
                        = 14;

                    break;

                default:
                    
                    frame.mask
                        = buffer.subarray(2, 6);

                    frame.payloadOffset
                        = 6;

                    break;
            };

            payload
                = buffer.subarray(frame.payloadOffset);

            frame.decoded
                = new Uint8Array(new ArrayBuffer(frame.payloadLength));

            for (let i = 0; i < frame.payloadLength; i++)
            {
                frame.decoded[i] = (payload[i] ^ frame.mask[i % 4]);
            }

            applicationData = frame.decoded.buffer;
            
            if (frame.FIN && frame.opCode !== 0x0)
            {
                switch (frame.opCode)
                {
                    case 0x1:
                        
                        // text frame.
                        messageHandler(transformApplicationData(0x1, applicationData), sendFn);
                            
                        break;
                        
                    case 0x2:
                        
                        // binary frame.
                        messageHandler(transformApplicationData(0x2, applicationData), sendFn);
                        
                        break;

                    case 0x8:

                        send(0x8);

                        dispatcher.close(socket);
                        
                        break;

                    case 0x9:
                        
                        send(0xA, applicationData);

                        break;

                    default:

                        break;
                };
                
                // ...
                
                // if the next frame is contained within this payload. 
                let frameLength = frame.payloadOffset + frame.payloadLength;
                if (bufferLength > frameLength)
                {
                    return that.onData(buffer.subarray(frameLength));
                }
            }
            else
            {
                // handle a continuation frame.
                if (!fragmentedMessage)
                {
                    fragmentedMessage = new ArrayBuffer(applicationData);
                    
                    // note: frame.opCode SHOULD be 0x1 OR 0x2.
                    fragmentedMessageType = frame.opCode;
                }
                else
                {
                    let 
                        appendFromIndex
                            = fragmentedMessage.length, 
                        
                        newBuffer
                            = new Uint8Array(ArrayBuffer.transfer(fragmentedMessage, applicationData.length));
                            
                    newBuffer.set(applicationData, appendFromIndex);
                    fragmentedMessage = newBuffer.buffer;
                }

                if (frame.FIN)
                {
                    let transformedApplicationData = transformApplicationData(
                        fragmentedMessageType, 
                        fragmentedMessage
                    );
                    
                    // reset state for next message.
                    fragmentedMessage = null;
                    fragmentedMessageType = null;
                    
                    // handle (assembled) message.  
                    messageHandler(transformedApplicationData, sendFn);
                }
            }
        },
        
        onClose: () => {
            heartbeat.clear();
        }
    };
};

// ...

// exports a factory function for creating the websocket middleware.
//
// The 'messageHandler' callback is to be used as follows:
//
// messageHandler = (message, sendFn) {
//  // handle incoming 'message', which may either be of type 'string' or an instance of ArrayBuffer.
//  // ...
//  // send message to client.
//  sendFn('Hello World')
//  sendFn(JSON.stringify({ ... }))
// }
export let websocket = (messageHandler) => {
    return (req, res, context, next) => {
        
        // websocket server handshake.
        res.status(101)
            .set('Upgrade', 'websocket')
            .set('Connection', 'Upgrade')
            .set(
                'Sec-WebSocket-Accept', 
                CryptoJS.enc.Base64.stringify(
                    CryptoJS.SHA1(req.headers['Sec-WebSocket-Key'] + GUID)
                )
            )
            .send();
            
        // register dispatcher function for websocket messages originating from the client 'context.socket'.
        dispatcher.register(context.socket, WebSocketDispatcher(context.socket, messageHandler));
    }; 
};