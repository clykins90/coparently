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
 * Send an invitation email to a child user
 * @param {string} childEmail - The email address of the child to invite
 * @param {string} firstName - The first name of the child
 * @param {string} lastName - The last name of the child
 * @param {string} invitationToken - The unique token for the invitation
 * @param {string} parentName - The name of the parent sending the invitation
 * @returns {Promise<Object>} - A promise that resolves to an object with success status
 */
async function sendChildUserInvitation(childEmail, firstName, lastName, invitationToken, parentName) {
  try {
    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/child-signup?token=${invitationToken}`;
    
    const msg = {
      to: childEmail,
      from: 'court.lykins@gmail.com', // Verified sender email
      subject: `${parentName} has invited you to join Coparently`,
      text: `Hello ${firstName},\n\n${parentName} has invited you to join Coparently, a platform for co-parenting coordination. Click the link below to create your account:\n\n${inviteUrl}\n\nThis invitation will expire in 48 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Hello ${firstName},</h2>
          <p>${parentName} has invited you to join <strong>Coparently</strong>, a platform for co-parenting coordination.</p>
          <p>Click the button below to create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Create Your Account</a>
          </div>
          <p style="color: #718096; font-size: 14px;">This invitation will expire in 48 hours.</p>
        </div>
      `,
    };
    
    const response = await sgMail.send(msg);
    console.log(`Child invitation email sent to ${childEmail}`);
    return { success: true, message: 'Child invitation email sent successfully', response };
  } catch (error) {
    console.error('Error sending child invitation email:', error);
    return { success: false, message: 'Failed to send child invitation email', error: error.message };
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
  sendChildUserInvitation,
  sendTestEmail
}; 