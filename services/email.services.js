import { mailer } from "../configuration/nodemailer.js";
import { AppError } from "../library/classes/AppError.js";
import { compileEmailTemplates } from "../library/utils/emailFormatter.js";

export const sendEmail = async (to, subject, template, data) => {
    if (!to) throw new AppError("No email provided", 400);

    const { html, text } = compileEmailTemplates(template, data);

    const finalHtml = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        ${html}
        <br/>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    const finalText = `${text}\n\nWarmly,\nThe Team at Makati Human Milk Bank`;

    await mailer.sendMail({
        from: `"Makati Human Milk Bank" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: finalText,
        html: finalHtml,
    });
};

export const sendDonorApproval = async (email, name) => {
    await sendEmail(email, "Welcome to the Community!", "donor-approval", { name });
};

export const sendBeneficiaryApproval = async (email, name) => {
    await sendEmail(email, "Welcome to the Program", "beneficiary-approval", { name });
};

export const sendDonorRejection = async (email, name) => {
    await sendEmail(
        email,
        "Update on your application to Makati Human Milk Bank",
        "donor-rejection",
        { name },
    );
};

export const sendBeneficiaryRejection = async (email, name) => {
    await sendEmail(
        email,
        "Update on your application to Makati Human Milk Bank",
        "beneficiary-rejection",
        { name },
    );
};

export const sendAllocationEmail = async (beneficiary, allocatedVolume) => {
    const email = beneficiary.caregiver_email;
    if (!email) throw new Error("No email provided");

    await sendEmail(email, "Your Milk Request Has Been Allocated", "allocation-notification", {
        caregiver: beneficiary.caregiver,
        name: beneficiary.name,
        allocatedVolume,
    });
};

export const sendCancelationEmail = async (beneficiary) => {
    const email = beneficiary.caregiver_email;
    if (!email) throw new Error("No email provided");

    await sendEmail(email, "Update: Your Milk Request Was Canceled", "cancelation-notification", {
        caregiver: beneficiary.caregiver,
        name: beneficiary.name,
    });
};
