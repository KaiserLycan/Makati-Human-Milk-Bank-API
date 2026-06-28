import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

export const mailer =
    process.env.NODE_ENV === "test"
        ? {
            sendMail: async (options) => {
                return { messageId: "mocked-test-id" };
            },
        }
        : nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

if (process.argv[1] === import.meta.filename) {
    const dotenv = await import("dotenv");
    dotenv.config();

    const testMailer = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    console.log("Verifying SMTP connection details...");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_APP_PASSWORD length:", process.env.EMAIL_APP_PASSWORD?.length);

    testMailer.verify()
        .then(() => {
            console.log("SMTP connection verified successfully!");
            if (process.env.EMAIL_USER) {
                console.log("Sending a test email to self...");
                testMailer.sendMail({
                    from: `"Test Mailer" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_USER,
                    subject: "Nodemailer Transporter Verification Test",
                    text: "If you are reading this, the nodemailer transporter is fully working!",
                })
                .then(info => console.log("Test email sent successfully! Message ID:", info.messageId))
                .catch(err => console.error("Error sending test email:", err));
            }
        })
        .catch(err => {
            console.error("SMTP verification failed:", err);
        });
}
