const ReBlock = new class ReBlock {
    #Services = {};
    #Vars;

    Components = {};

    constructor() {
        const Vars = this.#Vars = {
            Promises: {},
            Data: {}
        }
        
        Vars.Signal = class Signal {
            constructor(service, name) {
                this.Service = service;
                this.Name = name;
                
                this.Connection = undefined;
            }

            FireClient(...args) {
                window.postMessage(
                    {
                        Network: "ReBlock",
                        Service: this.Service,
                        Signal: this.Name,
                        Type: "FireClient",
                        Arguments: args
                    },
                    "*"
                );
            }
            
            Connect(handler) {
                if (typeof handler === "function") {
                    this.Connection = handler;
                } else {
                    console.error("[Signal] Connect failed, handler is not a function.");
                }
            }
            
            Fire(...args) {
                if (this.Connection) {
                    return this.Connection(...args);
                }
                
                return null;
            }
            
            Disconnect() {
                this.Connection = undefined;
            }
        }
    }

    #Established_Response(data) {
        const Services = this.#Services;
        const Vars = this.#Vars;

        return {
            Extensions: Vars.Extensions,
            Services: Object.keys(Services).map((key) => {
                const service = Services[key];

                return {
                    Name: service.Name,
                    Signals: Object.keys(service.Signals),
                }
            })
        }
    }
    
    #MessageProcessor(event) {
        const { Network, Service, Signal, Type, Arguments, Id } = event.data;

        if (!(event.source === window && Network === "ReBlock")) {
            return;
        }

        if (Service === "Handshake") {
            return;
        }
        
        const obj = this.#GetService(Service);
        if (obj && (Type === "FireService" || Type === "InvokeService") && obj.Signals[Signal]) {
            let response;

            if (Array.isArray(Arguments)) {
                response = obj.Signals[Signal].Fire(...Arguments);
            } else {
                response = obj.Signals[Signal].Fire();
            }
            
            if (Type === "InvokeService" && response) {
                window.postMessage(
                    {
                        Network: "ReBlock",
                        Service: Service,
                        Signal: Signal,
                        Type: "InvokeService_Response",
                        Response: response,
                        Id: Id
                    },
                    "*"
                );
            }
        }
        
        return true;
    }

    async #EstablishConnection() {
        const startTime = performance.now();
        
        const responseData = {
            
        }
        
        window.addEventListener("message", (event) => {
            if (event.source !== window) {
                return;
            }

            const { Network, Service, Signal, Id } = event.data;
            if (Network === "ReBlock" && Service === "Handshake" && Signal === "Request" && Id) {
                if (!this.#Connection_Established) {
                    console.warn("[Service] Handshake request received");
                    window.postMessage(
                        {
                            Network: "ReBlock",
                            Service: "Handshake",
                            Signal: "Response",
                            Response: this.#Established_Response(responseData),
                            Id: Id
                        },
                        "*"
                    );

                    const endTime = performance.now();
                    const handshakeDuration = endTime - startTime;
                    console.warn(`[Service] Handshake completed in ${handshakeDuration.toFixed(2)} ms`);

                    this.#Connection_Established = true;
                    console.warn("[Service] Connection established with Injected script");

                    if (this.#Vars.Promises.Connected) {
                        const resolve = this.#Vars.Promises.Connected.Resolve;

                        delete this.#Vars.Promises.Connected;
                        resolve(true);
                    }
                }

                return;
            }

            this.#MessageProcessor(event);
        });
    }

    #GetExtensions() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ Environment: "Background", Type: "GetExtensions" }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    GetPinned() {
        return this.#Vars.Pinned;
    }

    Connected() {
        if (this.#Connection_Established) {
            return new Promise((resolve, reject) => {
                resolve(true);
            });
        }

        if (this.#Vars.Promises.Connected) {
            return this.#Vars.Promises.Connected.Promise;
        }
        
        let newResolve, newReject;
        
        const newPromise = new Promise((resolve, reject) => {
            newResolve = resolve;
            newReject = reject;
        });
        
        this.#Vars.Promises.Connected = { Promise: newPromise, Resolve: newResolve, Reject: newReject };
        
        return newPromise;
    }

    CreateService(serviceName, serviceClass) {
        const Services = this.#Services;
        const lower = serviceName.toLowerCase();

        if (Services[lower]) {
            throw new Error(`Block with name "${serviceName}" already exists.`);
        }

        const service = Services[lower] = {
            Name: serviceName,
            Signals: {}
        }

        service.CreateSignal = (signalName) => {
            return service.Signals[signalName] = new this.#Vars.Signal(serviceName, signalName);
        }
        
        service.Class = new serviceClass(service);

        return service.Class;
    }

    #GetService(name) {
        const Services = this.#Services;
        const lower = name.toLowerCase();

        if (!Services[lower]) {
            throw new Error(`There is no block with the "${name}" that exists.`);
        }

        return Services[lower];
    }

    GetService(name) {
        const Services = this.#Services;
        const lower = name.toLowerCase();

        if (!Services[lower]) {
            throw new Error(`There is no block with the "${name}" that exists.`);
        }

        return Services[lower].Class;
    }

    GetExtensions() {
        return this.#Vars.Extensions;
    }

    async Start() {
        const Services = this.#Services;
        const Vars = this.#Vars;

        const extensionsResponse = await this.#GetExtensions();
        const Extensions = Vars.Extensions = IsArray(extensionsResponse) ? extensionsResponse : [];
        
        console.warn("[Service] ReBlock Started!");

        if (Vars.Started) {
            return;
        } else {
            Vars.Started = true;
        }
        
        const Promises = {}
        
        Promises.Start = Object.keys(Services).map((key) => {
            const service = Services[key];

            if (typeof service.Class.Start === "function" && service.Class.RejectCycle !== true) {
                return Promise.resolve()
                    .then(() => service.Class.Start())
                    .catch((err) => {
                        console.error(`Error in block "${service.Name}" Start():`, err);

                        throw err;
                    });
            }

            return Promise.resolve();
        });

        try {
            await Promise.all(Promises.Start);
        } catch (err) {
            throw new Error("ReBlock.Start() failed due to Blocks.Start() error.");
        }

        Promises.Init = Object.keys(Services).map((key) => {
            const service = Services[key];

            if (typeof service.Class.Init === "function" && service.Class.RejectCycle !== true) {
                return Promise.resolve()
                    .then(() => service.Class.Init())
                    .catch((err) => {
                        console.error(`Error in block "${service.Name}" Init():`, err);

                        throw err;
                    });
            }

            return Promise.resolve();
        });

        try {
            await Promise.all(Promises.Init);
        } catch (err) {
            throw new Error("ReBlock.Start() failed due to Blocks.Init() error.");
        }

        this.#EstablishConnection();
    }
}();