const ReBlock = global.ReBlock;
const Vars = ReBlock.GetVariables();

ReBlock.CreateBlock("Mail", class {
    #Block = undefined;
    #Types;

    #Level = 100;
    #Order = 2;

    #From = `"Golden-age" <fabian.youtubbe@gmail.com>`;
    constructor(block) {
        this.#Block = block;

        block.Level = this.#Level;
        block.Order = this.#Order;
    }

    async #Send(body, maxAttempts = 1, delay = 5000) {
        const { Transporter } = Vars;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const info = await Transporter.sendMail(body);

                return { Success: true, Response: info };
            } catch (error) {
                if (attempt < maxAttempts) {
                    await Vars.Wait(delay);
                } else {
                    return { Success: false, Response: error };
                }
            }
        }
    }

    async SendAccountConfirmation(username, email, link) {
        const body = {
            from: this.#From,
            to: email,
            subject: "Password Reset",
            html: this.#Types.Password.CreateHtml(username, link)
        };
        
        return await this.#Send(body, 5, 10000);
    }

    async SendPasswordReset(email, link) {
        const body = {
            from: this.#From,
            to: email,
            subject: "Account Registration Confirmation",
            html: this.#Types.Account.CreateHtml(username, link)
        };

        return await this.#Send(body, 5, 10000);
    }

    Start() {
        this.#Types = {
            Account: ReBlock.GetBlock("AccountConfirmationMail"),
            Password: ReBlock.GetBlock("PasswordResetMail")
        }
    }
});