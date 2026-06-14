import EmailAPI from "../lib/nodemailer.lib.js";

export const SendApproval = async (applicant, type) => {
    if (!applicant.email) throw new Error("No email provided");

    const isDonor = type === "donor";
    const subjectLine = isDonor
        ? "Welcome to the MHMB Donor Community!"
        : "Welcome to the MHMB Beneficiary Program";

    const donorText = `Thank you ${applicant.name}, from the bottom of our hearts for applying to be a donor at the Makati Human Milk Bank. Your generosity will directly help babies in the NICU and support mothers in need.

    Here is how you can begin donating:

    * Donate Remotely: Call our team at 09763026873 to arrange a consultation.
    * Donate In-Person: Visit the Makati Hospital, your nearest Makati Health Center, or the Makati Human Milk Bank directly.

    To learn more about the impact your milk will make, visit our website: https://makati-human-milk-bank-web.vercel.app/

    We are deeply grateful for your support and look forward to working with you.

    Warmly,
    The Team at Makati Human Milk Bank`;

    const beneficiaryText = `We are absolutely delighted to welcome your baby ${applicant.name}, into the Makati Human Milk Bank Beneficiary Program.

    Our core mission is to support babies admitted to the NICU and provide a helping hand to mothers who cannot currently provide milk for their little ones. You are not alone, and we are here to support you.

    To request your milk supply, please reach out to our team at 09763026873. We are ready to assist you.

    Wishing you and your baby the very best.

    Warmly,
    The Team at Makati Human Milk Bank`;

    const donorHtml = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <h2 style="color: #2c3e50;">Welcome to our Community!</h2>
        <p>Thank you ${applicant.name}, from the bottom of our hearts for applying to be a donor at the <b>Makati Human Milk Bank</b>. Your generosity will directly help babies in the NICU and support mothers in need.</p>
    
        <p>Here is how you can begin donating:</p>
        <ul>
          <li><b>Donate Remotely:</b> Call our team at <b>09763026873</b> to arrange a consultation.</li>
          <li><b>Donate In-Person:</b> Visit the Makati Hospital, your nearest Makati Health Center, or the Makati Human Milk Bank directly.</li>
        </ul>
    
        <p>To learn more about the impact your milk will make, please <a href="https://makati-human-milk-bank-web.vercel.app/" style="color: #0056b3; text-decoration: underline;">visit our website</a>.</p>
        <br/>
        <p>We are deeply grateful for your support.</p>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    const beneficiaryHtml = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <h2 style="color: #2c3e50;">Welcome to the Program</h2>
        <p>We are absolutely delighted to welcome your baby ${applicant.name}, into the <b>Makati Human Milk Bank Beneficiary Program</b>.</p>
        
        <p>Our core mission is to support babies admitted to the NICU and provide a helping hand to mothers who cannot currently provide milk for their little ones. You are not alone, and we are here to support you.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
          <p style="margin: 0;">To request your milk supply, please reach out to our team at <b>09763026873</b>. We are ready to assist you.</p>
        </div>
    
        <p>Wishing you and your baby the very best.</p>
        <br/>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    await EmailAPI.sendMail({
        from: `"Makati Human Milk Bank" <${process.env.EMAIL_USER}>`,
        to: applicant.email,
        subject: subjectLine,
        text: isDonor ? donorText : beneficiaryText,
        html: isDonor ? donorHtml : beneficiaryHtml,
    });
};

export const SendRejection = async (applicant, type) => {
    if (!applicant.email) throw new Error("No email provided");

    const isDonor = type === "donor";
    // A neutral, professional subject line is best for rejections
    const subjectLine = "Update on your application to Makati Human Milk Bank";

    // 1. Draft the Plain Text versions
    const donorText = `Dear ${applicant.name},

    Thank you from the bottom of our hearts for your generous offer to donate to the Makati Human Milk Bank. 
    
    After carefully reviewing your application, we are unable to accept you as a donor at this time. Our screening process is governed by strict health and safety guidelines to protect the highly vulnerable premature infants in the NICU. 
    
    Please know that while we cannot accept your donation, your willingness to help mothers and babies means the world to us. If you have any questions regarding this decision, please contact us at 09763026873.
    
    We deeply appreciate your kindness and wish you the best.
    
    Warmly,
    The Team at Makati Human Milk Bank`;

    const beneficiaryText = `Dear ${applicant.name},

    Thank you for reaching out to the Makati Human Milk Bank. We have carefully reviewed your application for the Beneficiary Program. 

    It is with a heavy heart that we must inform you that we cannot fulfill your request for donor milk at this time. Currently, our extremely limited supply must be strictly prioritized for premature and critically ill infants admitted to the NICU. 
    
    We understand this is disappointing news, and we truly wish we had the resources to support every family who reaches out to us. For guidance on alternative feeding options and support, please consult with your pediatrician or your local Makati Health Center.
    
    Wishing you and your baby health and strength.
    
    Warmly,
    The Team at Makati Human Milk Bank`;

    const donorHtml = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <h2 style="color: #2c3e50;">Application Update</h2>
        <p>Dear ${applicant.name},</p>
        <p>Thank you from the bottom of our hearts for your generous offer to donate to the <b>Makati Human Milk Bank</b>.</p>
        
        <p>After carefully reviewing your application, we are unable to accept you as a donor at this time. Our screening process is governed by strict health and safety guidelines to protect the highly vulnerable premature infants in the NICU.</p>
        
        <p>Please know that while we cannot accept your donation, your willingness to help mothers and babies means the world to us. If you have any questions regarding this decision, please reach out to our team at <b>09763026873</b>.</p>
    
        <br/>
        <p>We deeply appreciate your kindness and wish you the best.</p>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    const beneficiaryHtml = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <h2 style="color: #2c3e50;">Application Update</h2>
        <p>Dear ${applicant.name},</p>
        <p>Thank you for reaching out to the <b>Makati Human Milk Bank</b>. We have carefully reviewed your application for the Beneficiary Program.</p>
        
        <p>It is with a heavy heart that we must inform you that we cannot fulfill your request for donor milk at this time. Currently, our extremely limited supply must be strictly prioritized for premature and critically ill infants admitted to the NICU.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #6c757d; margin: 20px 0;">
          <p style="margin: 0;">We understand this is disappointing news, and we truly wish we had the resources to support every family. For guidance on alternative feeding options, please consult with your pediatrician or your local Makati Health Center.</p>
        </div>
    
        <br/>
        <p>Wishing you and your baby health and strength.</p>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    await EmailAPI.sendMail({
        from: `"Makati Human Milk Bank" <${process.env.EMAIL_USER}>`,
        to: applicant.email,
        subject: subjectLine,
        text: isDonor ? donorText : beneficiaryText,
        html: isDonor ? donorHtml : beneficiaryHtml,
    });
};

export const SendAllocationNotification = async (beneficiary, allocatedVolume) => {
    if (!beneficiary.caregiver_email) throw new Error("No email provided");

    const subjectLine = "Your Milk Request Has Been Allocated";

    const text = `Dear ${beneficiary.caregiver},

    Great news! We are pleased to inform you that milk has been allocated to fulfill the milk request for ${beneficiary.name}.

    Allocated Volume: ${allocatedVolume} ml
    Baby: ${beneficiary.name}

    Our team will contact you shortly with details on pickup or delivery arrangements. Please ensure someone is available to receive the milk and that it is properly stored in a refrigerator (2-4°C) or freezer immediately upon receipt.

    If you have any questions or need to reschedule, please contact us at 09763026873.

    Thank you for choosing Makati Human Milk Bank for your baby's nutrition and care.

    Warmly,
    The Team at Makati Human Milk Bank`;

    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <h2 style="color: #2c3e50;">Milk Request Allocated</h2>
        <p>Dear ${beneficiary.caregiver},</p>
        <p>Great news! We are pleased to inform you that milk has been allocated to fulfill the milk request for <b>${beneficiary.name}</b>.</p>
        
        <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="margin: 5px 0;"><b>Allocated Volume:</b> ${allocatedVolume} ml</p>
          <p style="margin: 5px 0;"><b>Baby:</b> ${beneficiary.name}</p>
        </div>

        <p>Our team will contact you shortly with details on pickup or delivery arrangements. Please ensure someone is available to receive the milk and that it is properly stored in a refrigerator (2-4°C) or freezer immediately upon receipt.</p>
        
        <p>If you have any questions or need to reschedule, please contact us at <b>09763026873</b>.</p>

        <br/>
        <p>Thank you for choosing Makati Human Milk Bank for your baby's nutrition and care.</p>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    await EmailAPI.sendMail({
        from: `"Makati Human Milk Bank" <${process.env.EMAIL_USER}>`,
        to: beneficiary.caregiver_email,
        subject: subjectLine,
        text: text,
        html: html,
    });
};

export const SendCancellationNotification = async (beneficiary) => {
    if (!beneficiary.caregiver_email) throw new Error("No email provided");

    const subjectLine = "Update: Your Milk Request Was Canceled";

    const text = `Dear ${beneficiary.caregiver},

    We are writing to inform you that unfortunately, the milk allocated for ${beneficiary.name} has passed its expiration date before it could be dispensed.
    
    As a result, your current request has been automatically canceled by the system to ensure the highest safety standards for the infants we serve.

    Please reach out to our team at 09763026873 to arrange a new request or discuss alternative options.

    Warmly,
    The Team at Makati Human Milk Bank`;

    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <h2 style="color: #2c3e50;">Reservation Update</h2>
        <p>Dear ${beneficiary.caregiver},</p>
        <p>We are writing to inform you that unfortunately, the milk allocated for <b>${beneficiary.name}</b> has passed its expiration date before it could be dispensed.</p>
        <p>As a result, your current request has been <b>automatically canceled</b> by the system to ensure the highest safety standards for the infants we serve.</p>
        <p>Please reach out to our team at <b>09763026873</b> to arrange a new request or discuss alternative options.</p>
        <br/>
        <p>Warmly,<br/><b>The Team at Makati Human Milk Bank</b></p>
      </div>
    `;

    await EmailAPI.sendMail({
        from: `"Makati Human Milk Bank" <${process.env.EMAIL_USER}>`,
        to: beneficiary.caregiver_email,
        subject: subjectLine,
        text: text,
        html: html,
    });
};
