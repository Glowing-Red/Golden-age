const nodemailer = require("nodemailer");

const IPv4 = "10.159.152.79";
const PORT = process.env.PORT || 3000;
const local = false;
const domain = `http://${(local == true ? "localhost" : IPv4)}:${PORT}`;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fabian.youtubbe@gmail.com',
        pass: 'gkjs zcqn mana gxap'
    }
});

async function sendPasswordResetEmail(toEmail, userName, resetToken) {
    const resetUrl = `https://discord.com/invite/PrenvUW6`;

    const mailOptions = {
        from: '"Golden-age" <fabian.youtubbe@gmail.com>',
        to: toEmail,
        subject: 'Password Reset',
        html: `
<table border="0" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background-color:#ffffff;border-radius:16px;" width="100%" role="presentation">
    <tbody><tr>
        <td align="center" valign="top">

            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>

            
            <table cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="background-color:#000000;border-radius:16px;width:600px;min-width:600px" role="presentation">
                <tbody><tr>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                    <td style="width:456px" width="456">

                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="72"></td>
                            </tr>
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td>
                                  <a href="https://www.rockstargames.com/" style="text-decoration:none" target="_blank"><img src="" height="85" width="85" border="0" style="display:block;color:#f0f0f0;font-size:24px;font-family:'HelveticaW1G',Helvetica,Arial,sans-serif" alt="Kindred Logo" class="CToWUd" data-bit="iit"></a>
                                </td>
                            </tr>           
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="36"></td>
                            </tr>
                        </tbody>
                    </table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="370" style="max-width:370px">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
                <strong>Password Reset</strong>
            </span>
        </td>
    </tr>           
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">
                A request was just made to reset the password for your Golden-age account
                <span style="font-weight: bold;">
                    ${userName}</span><span>.</span><br><span> If this was you, please click the following link before it expires: 
                </span>
                <a href="${resetUrl}" target="_blank">
                    <span style="text-decoration:underline;color:#ffffff">Reset Password</span>
                </a>
            </span>
        </td>
    </tr>           
</tbody></table>




<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
    
                        
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<hr style="border-width:0;background:#a6a6a6;color:#a6a6a6;height:2px">
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
                <span style="font-weight: bold;">This administrative message was sent to you by Kindred to help manage and protect your account.</span>
                <br>
                You're receiving this email because an action related to your account was requested, the link will be expired in 15 minutes. If you did not initiate this request, you can safely ignore this message.
                <br>
                <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
                    Kindred is committed to providing a safe, welcoming space where you can stay connected, share stories, and enjoy meaningful moments online.
                </span>
                <br>
                <br>
                <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
                    © ${new Date().getFullYear()} <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">Kindred</span>. All Rights Reserved.
                </span>
                <br>
                <br>
                <a href="https://www.rockstargames.com/legal" target="_blank""><span style="color:#a6a6a6;text-decoration:underline">Terms of Service</span></a>
                <br>
                <a href="https://www.rockstargames.com/privacy" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Privacy Policy</span></a>
                <br>
                <a href="https://support.rockstargames.com/" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Support</span></a>
            </span>
        </td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="24"></td>
    </tr>
</tbody></table>

 
                        

            
            
            
                    </td>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                </tr>
            </tbody></table>
            
            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>
        </td>
    </tr>
</tbody></table>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Reset email sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

async function SendAccountConfirmation(toEmail, userName, confirmToken) {
    const resetUrl = `${domain}/registration-confirmation?Token=${confirmToken}`;

    const mailOptions = {
        from: '"Golden-age" <fabian.youtubbe@gmail.com>',
        to: toEmail,
        subject: 'Account Registration Confirmation',
        html: `
<table border="0" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background-color:#ffffff;border-radius:16px" width="100%" role="presentation">
    <tbody><tr>
        <td align="center" valign="top">

            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>

            
            <table cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="background-color:#000000;width:600px;min-width:600px" role="presentation">
                <tbody><tr>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                    <td style="width:456px" width="456">

                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="72"></td>
                            </tr>
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td>
                                  <a href="https://www.rockstargames.com/" style="text-decoration:none" target="_blank"><img src="https://i.ibb.co/DfXFhrZ1/Amber-Leaf.png" height="85" width="85" border="0" style="display:block;color:#f0f0f0;font-size:24px;font-family:'HelveticaW1G',Helvetica,Arial,sans-serif" alt="Kindred Logo" class="CToWUd" data-bit="iit"></a>
                                </td>
                            </tr>           
                        </tbody></table>
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                            <tbody><tr>
                                <td style="font-size:1px;line-height:1px" height="36"></td>
                            </tr>
                        </tbody></table>
                        
                        

                        


<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="370" style="max-width:370px">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:38px;letter-spacing:-1.46px;line-height:42px;color:#ffffff">
                <strong>Account Registration</strong>
            </span>
        </td>
    </tr>           
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>


<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:24px;letter-spacing:0.48px;line-height:36px;color:#f0f0f0">A request was just made to create a Golden-age account named "<span style="
    font-weight: bold;
">${userName}</span>"<span> under your e-mail.</span><br><span> If this was you, please click the following link to continue the account registration: </span><a href="${resetUrl}" target="_blank"><span style="text-decoration:underline;color:#ffffff">Continue Registration</span></a></span>
        </td>
    </tr>           
</tbody></table>




<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
    
                        
                        
                        
                        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<hr style="border-width:0;background:#a6a6a6;color:#a6a6a6;height:2px">
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="48"></td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6">
            <span style="font-family:Helvetica,Arial,sans-serif;font-size:16px;letter-spacing:0.25px;line-height:24px;color:#a6a6a6"><span style="
    font-weight: bold;
">This administrative message was sent to you by Kindred to confirm and continue the registration of your Golden-age account.</span><br>You're receiving this email because an account registration under your e-mail was requested, the link will become invalid in 60 minutes and the account creation will be cancelled. If you did not request this registration, you can safely ignore this message.<br>Kindred is committed to providing a safe, welcoming space where you can stay connected, share stories, and enjoy meaningful moments online.<br>
                <br>
                © ${new Date().getFullYear()} <span>Kindred</span>. All Rights Reserved.
                <br>
                <br>
                <a href="https://www.rockstargames.com/legal" target="_blank""><span style="color:#a6a6a6;text-decoration:underline">Terms of Service</span></a>
                <br>
                <a href="https://www.rockstargames.com/privacy" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Privacy Policy</span></a>
                <br>
                <a href="https://support.rockstargames.com/" target="_blank"><span style="color:#a6a6a6;text-decoration:underline">Support</span></a>
            </span>
        </td>
    </tr>
</tbody></table>
<table border="0" cellspacing="0" cellpadding="0" role="presentation">
    <tbody><tr>
        <td style="font-size:1px;line-height:1px" height="24"></td>
    </tr>
</tbody></table>

 
                        

            
            
            
                    </td>
                    <td style="width:72px;font-size:1px;line-height:1px" width="72"></td>
                </tr>
            </tbody></table>
            
            <table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tbody><tr>
                    <td style="font-size:1px;line-height:1px" height="24"></td>
                </tr>
            </tbody></table>
        </td>
    </tr>
</tbody></table>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Reset email sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

SendAccountConfirmation("fraizor.youtubbe@gmail.com", "4KHax", "testToken");