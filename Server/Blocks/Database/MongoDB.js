const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Database", class {
    #Block = undefined;

    #Level = 90;
    #Order = 2;

    #Uri = "mongodb://localhost:27017";
    #Templates = {
        Accounts: [
            { _id: 1, Date: new Date(), Username: "f", Display: "Owner", Password: "f" },
            { _id: 2, Date: new Date(), Username: "a", Display: "Admin", Password: "a", Membership: "Golden" }
        ],

        Rooms: [
            { _id: "Golden", Type: "Group", Nickname: "Golden Hangout", Members: [1, 2], Messages: [] },
            { _id: "Peasantry", Type: "Group", Nickname: "Peasant Gathering", Messages: [] },
        ]
    }

    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    async #Connect() {
        const client = Vars.Client;

        try {
            await client.connect();

            Vars.Database = client.db("GoldenAge");
            console.log("Connected to MongoDB");
        } catch (err) {
            console.error("MongoDB connection error:", err);

            throw err;
        }
    }

    async #SaveAccountTemplates() {
        const Database = Vars.Database;
        const accounts = this.#Templates.Accounts;
        const collection = Database.collection("Accounts");

        let inserted = 0;
        for (let i = 0; i < accounts.length; i++) {
            const targetUser = accounts[i];
            const existingUser = await collection.findOne({ _id: targetUser._id });

            if (!existingUser) {
                targetUser.Password = await bcrypt.hash(targetUser.Password, 10);

                await collection.insertOne(targetUser);

                console.log("New user added:", targetUser);
                inserted++;
            }
        }

        if (inserted > 0) {
            console.log("Saved account templates");
        }
    }

    async #SaveRoomTemplates() {
        const Database = Vars.Database;
        const rooms = this.#Templates.Rooms;
        const collection = Database.collection("Rooms");

        let inserted = 0;
        for (let i = 0; i < rooms.length; i++) {
            const targetRoom = rooms[i];
            const existingRoom = await collection.findOne({ _id: targetRoom._id });

            if (!existingRoom) {
                await collection.insertOne(targetRoom);

                console.log("New room created:", targetRoom);
                inserted++;
            }
        }

        if (inserted > 0) {
            console.log("Saved room templates");
        }
    }

    async #SaveTemplates() {
        await this.#SaveAccountTemplates();
        await this.#SaveRoomTemplates();
    }

    async Start() {
        const { MongoClient, GridFSBucket, Multer, } = Vars;

        const Storage = Multer.memoryStorage();
        Vars.Client = new MongoClient(this.#Uri);
        Vars.Upload = Multer({
            storage: Storage,
            limits: { fileSize: 25 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith("image/")) {
                    cb(null, true);
                } else {
                    cb(new Error("Endast bildfiler är tillåta!"), false);
                }
            }
        });

        Vars.Set = {
            Locked: {
                Ids: new Set(),
                Tokens: new Set()
            },

            Cooldown: {
                Email: new Set()
            }
        }

        Vars.Map = {
            Locked: {
                Usernames: new Map()
            },

            Temporary: {
                Accounts: new Map()
            }
        }

        await this.#Connect();
        await this.#SaveTemplates();

        Vars.GridFS = {
            Images: new GridFSBucket(Vars.Database, { bucketName: "images" })
        }
    }
});