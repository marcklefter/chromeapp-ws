
import {app} from './app';

// ...

chrome.app.runtime.onLaunched.addListener(() => {
    app.init();    
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    app.init(sendResponse);
    return true;
});

chrome.runtime.onSuspend.addListener(() => {
    app.deinit(); 
});