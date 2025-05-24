const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock(ReBlock.GenerateName(), class {
    #Block = undefined;

    #Level = 30;
    #Order = 1;

    #Route = "get-message-image:roomId/:gridFSId";
    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    async #GetEndpoint(req, res) {
        console.log("Image request");

        try {
            const cookie = req.cookies.auth_token;
            const roomId = req.params.roomId;

            console.log("Image request Room Id: ", roomId);

            if (!roomId) {
                return res.json({ Success: false, Message: "no room id provided" });
            }

            if (!cookie) {
                return res.json({ Success: false, Message: "Unauthorized" });
            }

            const credentials = await GetCredentials(cookie);
            if (credentials.Success != true) {
                return res.json({ Success: false, Message: "Unauthorized" });
            }

            const userId = credentials.UserId;

            let imageObjectId;
            try {
                imageObjectId = new ObjectId(req.params.gridFSId);
            } catch (e) {
                return res.status(400).json({ message: 'Ogiltigt bild-ID-format.' });
            }

            const roomsCollection = db.collection("Rooms");
            const room = await roomsCollection.findOne({
                _id: roomId,
                "Messages": {
                    $elemMatch: {
                        "MessageType": "image",
                        "ImageId": imageObjectId
                    }
                }
            });

            if (!room) {
                const roomExists = await roomsCollection.findOne({ _id: roomId });

                if (!roomExists) {
                    console.warn(`Rum ${roomId} hittades inte.`);
                    return res.status(404).send('Chattrummet hittades inte.');
                }

                console.warn(`Bild med GridFS ID ${imageObjectId} hittades inte som ett bildmeddelande i rum ${roomId}.`);
                return res.status(404).send('Bilden hittades inte eller är inte kopplad till ett bildmeddelande i detta chattrum.');
            }

            const isParticipant = room.Members.includes(userId);

            if (!isParticipant) {
                console.warn(`Användare ${userId} försökte få åtkomst till bild ${imageObjectId} men är inte deltagare i chatt ${room._id}.`);

                return res.status(403).send('Du har inte behörighet att se denna bild i den här chatten.');
            }

            const bucket = Vars.GridFS.Images;
            const filesCollection = db.collection('images.files');

            const fileInfo = await filesCollection.findOne({ _id: imageObjectId });
            if (!fileInfo) {
                console.error(`Bildfil med GridFS ID ${imageObjectId} hittades inte i GridFS.`);
                return res.status(404).send('Bildfilen hittades inte i databasen.');
            }

            res.set('Content-Type', fileInfo.contentType || 'application/octet-stream');
            const downloadStream = bucket.openDownloadStream(imageObjectId);

            downloadStream.on('error', (err) => {
                console.error('Fel vid nedladdning av bild från GridFS:', err);
                res.status(404).send('Ett fel uppstod vid hämtning av bilden.');
            });

            downloadStream.pipe(res);
            console.log("res!");
        } catch (error) {
            console.error('SERVERFEL vid bildhämtning (catch-block):', error);

            if (error.name === 'BSONTypeError' || error.name === 'CastError') {
                return res.status(400).json({ message: 'Ogiltigt bild-ID i begäran.' });
            }

            res.status(500).json({ message: 'Ett oväntat serverfel uppstod.' });
        }
    }

    Init() {
        const { App } = Vars;

        App.get(`/api/${this.#Route}`, this.#GetEndpoint);
    }
});