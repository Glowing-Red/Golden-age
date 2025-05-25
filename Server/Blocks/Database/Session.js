const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Session", class {
    #Block = undefined;

    #Level = 90;
    #Order = 3;

    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    async GetActive(token) {
        const { Database } = Vars;

        if (!token) {
            return { Success: false, UserId: null };
        }
        
        const collection = Database.collection("Sessions");
        const session = await collection.findOne({ _id: token });

        if (session) {
            return { Success: true, UserId: session .UserId };
        }

        return { Success: false, UserId: null };
    }
});