// Email service using SendGrid
// This service handles sending emails through the SendGrid API

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an invitation email to a partner
 * @param {string} partnerEmail - The email address of the partner to invite
 * @param {string} invitingUserName - The name of the user sending the invitation
 * @returns {Promise<Object>} - A promise that resolves to an object with success status
 */
async function sendPartnerInvitation(partnerEmail, invitingUserName) {
  try {
    const msg = {
      to: partnerEmail,
      from: 'court.lykins@gmail.com', // Verified sender email
      subject: `${invitingUserName} has invited you to Coparently`,
      text: `${invitingUserName} has invited you to join them on Coparently, a platform for co-parenting coordination.`,
      html: `<p>${invitingUserName} has invited you to join them on <strong>Coparently</strong>, a platform for co-parenting coordination.</p>
             <p>Click <a href="https://coparently.com/signup">here</a> to sign up.</p>`,
    };
    
    const response = await sgMail.send(msg);
    console.log(`Email sent to ${partnerEmail}`);
    return { success: true, message: 'Email sent successfully', response };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
}

/**
 * Send a test email to verify SendGrid is working
 * @param {string} toEmail - The email address to send the test to
 * @returns {Promise<Object>} - A promise that resolves to an object with success status
 */
async function sendTestEmail(toEmail) {
  try {
    const msg = {
      to: toEmail,
      from: 'court.lykins@gmail.com', // Verified sender email
      subject: 'SendGrid Test Email',
      text: 'This is a test email from SendGrid to verify the integration is working.',
      html: '<p>This is a test email from SendGrid to verify the integration is working.</p>',
    };
    
    const response = await sgMail.send(msg);
    console.log(`Test email sent to ${toEmail}`);
    return { success: true, message: 'Test email sent successfully', response };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, message: 'Failed to send test email', error: error.message };
  }
}

module.exports = {
  sendPartnerInvitation,
  sendTestEmail
}; 