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
