export const verifyAccountTemplate = (firstName, otp) => `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: #4CAF50; padding: 20px; text-align: center; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verify Your Account</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <p>Hello <strong>${firstName || "User"}</strong>,</p>
                <p>We received a request to verify your account. Use the code below to complete your verification:</p>

                <p style="font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; background: #f4f4f4; padding: 10px; border-radius: 8px; color: #4CAF50;">
                    ${otp}
                </p>

                <p>If you did not request this, you can safely ignore this email. The OTP will expire in 10 minutes.</p>

                <p style="margin-top: 30px;">Stay secure,</p>
                <p><strong>Your Team at Masterchief Devs</strong></p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;" />

                <p style="font-size: 12px; color: #777;">
                    If you have any issues, contact our support team at 
                    <a href="mailto:support@masterchiefdevs.com" style="color: #4CAF50;">support@masterchiefdevs.com</a>.
                </p>
            </td>
        </tr>
    </table>
</div>
`;

// Password Reset Email Template
export const passwordResetTemplate = (firstName, otp) => `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: #FF5722; padding: 20px; text-align: center; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Reset Your Password</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <p>Hello <strong>${firstName || "User"}</strong>,</p>
                <p>We received a request to reset your password. Use the OTP below to complete the process:</p>

                <p style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 4px; background: #f4f4f4; padding: 12px; border-radius: 8px; color: #FF5722;">
                    ${otp}
                </p>

                <p>If you did not request a password reset, you can safely ignore this email. This OTP will expire in 1 hour.</p>

                <p style="margin-top: 30px;">Stay secure,</p>
                <p><strong>Your Team at Master Chief Devs</strong></p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;" />

                <p style="font-size: 12px; color: #777;">
                    If you have any issues, contact our support team at 
                    <a href="mailto:support@masterchiefdevs.com" style="color: #FF5722;">support@masterchiefdevs.com</a>.
                </p>
            </td>
        </tr>
    </table>
</div>
`;
