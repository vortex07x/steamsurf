import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendOTPEmail = async (email, otp, username = 'User') => {
  try {
    const emailData = {
      sender: {
        name: 'StreamSurf',
        email: 'ecommtest07@gmail.com'
      },
      to: [
        {
          email: email,
          name: username
        }
      ],
      subject: 'Password Reset OTP - StreamSurf',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              background-color: #000000;
              color: #ffffff;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #0a0a0a;
              border: 1px solid #333;
            }
            .header {
              background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 3px;
              text-transform: uppercase;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
              color: #ffffff;
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              text-align: center;
              padding: 20px;
              margin: 30px 0;
              border-radius: 8px;
            }
            .info-text {
              color: #a1a1aa;
              font-size: 14px;
              line-height: 1.6;
              margin: 20px 0;
            }
            .warning {
              background-color: #1a1a1a;
              border-left: 4px solid #d946ef;
              padding: 15px;
              margin: 20px 0;
              font-size: 13px;
              color: #d4d4d8;
            }
            .footer {
              background-color: #000000;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #333;
            }
            .footer p {
              color: #71717a;
              font-size: 12px;
              margin: 5px 0;
            }
            .divider {
              width: 40px;
              height: 4px;
              background: linear-gradient(90deg, #8b5cf6, #d946ef);
              margin: 20px auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎸 STREAMSURF</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 10px;">Password Reset Request</h2>
              <div class="divider"></div>
              
              <p class="info-text">Hello <strong style="color: #ffffff;">${username}</strong>,</p>
              <p class="info-text">
                We received a request to reset your StreamSurf account password. 
                Use the verification code below to proceed:
              </p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p class="info-text" style="text-align: center; color: #ffffff;">
                This code will expire in <strong>10 minutes</strong>
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                If you didn't request this password reset, please ignore this email. 
                Your account remains secure and no changes will be made.
              </div>
              
              <p class="info-text">
                For security reasons, never share this code with anyone. 
                StreamSurf support will never ask for your OTP.
              </p>
            </div>
            
            <div class="footer">
              <p style="color: #ffffff; font-weight: 600;">STREAMSURF</p>
              <p>Made with 🎸 and code</p>
              <p>© 2024 StreamSurf. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const response = await axios.post(BREVO_API_URL, emailData, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      }
    });

    return {
      success: true,
      messageId: response.data.messageId
    };

  } catch (error) {
    console.error('Brevo Email Error:', error.response?.data || error.message);
    throw new Error('Failed to send email');
  }
};