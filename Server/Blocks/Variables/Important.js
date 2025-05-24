const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock(ReBlock.GenerateName(), class {
    #Block = undefined;

    #Level = 100;
    #Order = 1;

    #IPv4 = "192.168.50.28";
    #LocalHost = false;

    #SecretKey = `Rosalith"s Very Secret, Very Personal, Very Professional, Very Strong and very secure key in production.`;
    constructor(block) {
        this.#Block = block;
        
        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    SetupExpress() {
        const Express = Vars.Express = require("express");
        Vars.App = Express();
    }

    SetupRequired() {
        Vars.JsonWebToken = require("jsonwebtoken");
        Vars.Bcrypt = require("bcryptjs");
        Vars.Crypto = require("crypto");
        Vars.Http = require("http");
        Vars.SocketIO = require("socket.io");
        Vars.Path = require("path");
        Vars.FileSystem = require("fs");
        Vars.Nodemailer = require("nodemailer");
        Vars.Multer = require("multer");
        Vars.Sharp = require("sharp");
        
        const Cookie = Vars.Cookie = require("cookie");
        Vars.CookieParser = require("cookie-parser");
        Vars.Parse = Cookie.parse;

        const MongoDatabase = Vars.MongoDatabase = require("mongodb");
        Vars.MongoClient = MongoDatabase.MongoClient;
        Vars.GridFSBucket = MongoDatabase.GridFSBucket;
        Vars.ObjectId = MongoDatabase.ObjectId;
    }

    SetupServer() {
        const Http = Vars.Http;
        const App = Vars.App;
        const SocketIO = Vars.SocketIO;

        Vars.Server = Http.createServer(App);
        Vars.IO = SocketIO(Vars.Server);
    }

    SetupMail() {
        const Nodemailer = Vars.Nodemailer = require("nodemailer");
        Vars.Transporter = Nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "fabian.youtubbe@gmail.com",
                pass: "gkjs zcqn mana gxap"
            }
        });
    }

    UseApp() {
        const Express = Vars.Express;
        const App = Vars.App;

        const CookieParser = Vars.CookieParser;
        const Path = Vars.Path;

        App.use(Express.json());
        App.use(Express.urlencoded({ extended: true }));
        App.use(CookieParser());
        App.use(Express.static("public"));
        App.use(Express.static(Path.join(__dirname, "public")));
    }
    
    async Start() {
        Vars.SECRET_KEY = this.#SecretKey;

        this.SetupExpress();
        this.SetupRequired();

        this.SetupServer();
        this.SetupMail();

        this.UseApp();

        const IPv4 = Vars.IPv4 = this.#IPv4;
        const PORT = Vars.PORT = (process.env.PORT || 3000);
        Vars.Domain = `http://${(this.#LocalHost == true ? "localhost" : IPv4)}:${PORT}`;
    }
});