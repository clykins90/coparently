const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendPartnerInvitation = async (partnerEmail, invitingUserName) => {
  try {
    const msg = {
      to: partnerEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `${invitingUserName} invited you to Coparently`,
      templateId: 'd-your-template-id', // Create this in SendGrid dashboard
      dynamicTemplateData: {
        invitingUser: invitingUserName,
        inviteLink: `${process.env.CLIENT_URL}/register?invite=true&email=${encodeURIComponent(partnerEmail)}`,
      },
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPartnerInvitation
}; 