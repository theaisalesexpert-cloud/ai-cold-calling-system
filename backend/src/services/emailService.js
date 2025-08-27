const nodemailer = require('nodemailer');
const { sheetsLogger } = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Check if email credentials are provided
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        sheetsLogger.warn('Email service disabled: Gmail credentials not provided');
        this.isEnabled = false;
        return;
      }

      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      this.isEnabled = true;
      sheetsLogger.info('Email transporter initialized');
    } catch (error) {
      sheetsLogger.error('Failed to initialize email transporter', { error: error.message });
      this.isEnabled = false;
      sheetsLogger.warn('Email service disabled due to initialization error');
    }
  }

  /**
   * Send similar cars email to customer
   */
  async sendSimilarCarsEmail(customerEmail, customerName, originalCarModel) {
    if (!this.isEnabled) {
      sheetsLogger.warn('Email service disabled, skipping email send', {
        customerEmail,
        customerName
      });
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      const subject = `Similar Car Options to ${originalCarModel} - Premier Auto`;
      const htmlContent = this.generateSimilarCarsEmailHTML(customerName, originalCarModel);
      const textContent = this.generateSimilarCarsEmailText(customerName, originalCarModel);

      const mailOptions = {
        from: `"Premier Auto Sales" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: 'car-options.pdf',
            path: './assets/car-brochure.pdf', // You'll need to create this
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);

      sheetsLogger.info('Similar cars email sent', {
        customerEmail,
        customerName,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      sheetsLogger.error('Failed to send similar cars email', {
        error: error.message,
        customerEmail,
        customerName
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmationEmail(customerEmail, customerName, appointmentDetails) {
    if (!this.isEnabled) {
      sheetsLogger.warn('Email service disabled, skipping appointment confirmation email', {
        customerEmail,
        customerName
      });
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      const subject = `Appointment Confirmation - ${appointmentDetails.carModel}`;
      const htmlContent = this.generateAppointmentEmailHTML(customerName, appointmentDetails);
      const textContent = this.generateAppointmentEmailText(customerName, appointmentDetails);

      const mailOptions = {
        from: `"Premier Auto Sales" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);

      sheetsLogger.info('Appointment confirmation email sent', {
        customerEmail,
        customerName,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      sheetsLogger.error('Failed to send appointment confirmation email', {
        error: error.message,
        customerEmail,
        customerName
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate HTML content for similar cars email
   */
  generateSimilarCarsEmailHTML(customerName, originalCarModel) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Similar Car Options</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .car-option { background-color: white; margin: 15px 0; padding: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .cta-button { background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Premier Auto Sales</h1>
                <p>Similar Car Options for You</p>
            </div>
            
            <div class="content">
                <h2>Hi ${customerName},</h2>
                
                <p>Thank you for speaking with us today! As promised, here are some excellent alternatives to the ${originalCarModel} that might interest you:</p>
                
                <div class="car-option">
                    <h3>🚗 2023 Honda Accord</h3>
                    <p><strong>Price:</strong> $28,500</p>
                    <p><strong>Features:</strong> Fuel efficient, reliable, spacious interior</p>
                    <p><strong>Mileage:</strong> 15,000 miles</p>
                </div>
                
                <div class="car-option">
                    <h3>🚗 2022 Toyota Camry</h3>
                    <p><strong>Price:</strong> $26,800</p>
                    <p><strong>Features:</strong> Hybrid option, advanced safety features</p>
                    <p><strong>Mileage:</strong> 22,000 miles</p>
                </div>
                
                <div class="car-option">
                    <h3>🚗 2023 Nissan Altima</h3>
                    <p><strong>Price:</strong> $25,900</p>
                    <p><strong>Features:</strong> Modern tech, comfortable ride</p>
                    <p><strong>Mileage:</strong> 18,000 miles</p>
                </div>
                
                <p>All vehicles come with:</p>
                <ul>
                    <li>✅ Comprehensive warranty</li>
                    <li>✅ Free CarFax report</li>
                    <li>✅ 30-day return guarantee</li>
                    <li>✅ Financing options available</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="tel:+1234567890" class="cta-button">Call Us: (123) 456-7890</a>
                    <a href="https://premierauto.com/schedule" class="cta-button">Schedule Test Drive</a>
                </div>
                
                <p>We'd love to help you find the perfect car! Feel free to call or visit our showroom anytime.</p>
                
                <p>Best regards,<br>
                <strong>Sarah Johnson</strong><br>
                Premier Auto Sales<br>
                📞 (123) 456-7890<br>
                📧 sarah@premierauto.com</p>
            </div>
            
            <div class="footer">
                <p>Premier Auto Sales | 123 Main Street, Your City, ST 12345</p>
                <p>If you no longer wish to receive emails, <a href="#">unsubscribe here</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate text content for similar cars email
   */
  generateSimilarCarsEmailText(customerName, originalCarModel) {
    return `
Hi ${customerName},

Thank you for speaking with us today! As promised, here are some excellent alternatives to the ${originalCarModel} that might interest you:

🚗 2023 Honda Accord
Price: $28,500
Features: Fuel efficient, reliable, spacious interior
Mileage: 15,000 miles

🚗 2022 Toyota Camry
Price: $26,800
Features: Hybrid option, advanced safety features
Mileage: 22,000 miles

🚗 2023 Nissan Altima
Price: $25,900
Features: Modern tech, comfortable ride
Mileage: 18,000 miles

All vehicles come with:
✅ Comprehensive warranty
✅ Free CarFax report
✅ 30-day return guarantee
✅ Financing options available

We'd love to help you find the perfect car! Feel free to call us at (123) 456-7890 or visit our showroom anytime.

Best regards,
Sarah Johnson
Premier Auto Sales
📞 (123) 456-7890
📧 sarah@premierauto.com

Premier Auto Sales | 123 Main Street, Your City, ST 12345
    `;
  }

  /**
   * Generate HTML content for appointment confirmation email
   */
  generateAppointmentEmailHTML(customerName, appointmentDetails) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Appointment Confirmed!</h1>
            </div>
            
            <div class="content">
                <h2>Hi ${customerName},</h2>
                
                <p>Great news! Your appointment has been confirmed. We're excited to show you the ${appointmentDetails.carModel}!</p>
                
                <div class="appointment-details">
                    <h3>📅 Appointment Details:</h3>
                    <p><strong>Date:</strong> ${appointmentDetails.date}</p>
                    <p><strong>Time:</strong> ${appointmentDetails.time}</p>
                    <p><strong>Vehicle:</strong> ${appointmentDetails.carModel}</p>
                    <p><strong>Location:</strong> Premier Auto Sales<br>123 Main Street, Your City, ST 12345</p>
                    <p><strong>Sales Representative:</strong> Sarah Johnson</p>
                </div>
                
                <p><strong>What to bring:</strong></p>
                <ul>
                    <li>Valid driver's license</li>
                    <li>Proof of insurance (for test drive)</li>
                    <li>Any trade-in vehicle information</li>
                </ul>
                
                <p>If you need to reschedule or have any questions, please call us at (123) 456-7890.</p>
                
                <p>Looking forward to seeing you!</p>
                
                <p>Best regards,<br>
                <strong>Sarah Johnson</strong><br>
                Premier Auto Sales</p>
            </div>
            
            <div class="footer">
                <p>Premier Auto Sales | 123 Main Street, Your City, ST 12345 | (123) 456-7890</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate text content for appointment confirmation email
   */
  generateAppointmentEmailText(customerName, appointmentDetails) {
    return `
✅ APPOINTMENT CONFIRMED!

Hi ${customerName},

Great news! Your appointment has been confirmed. We're excited to show you the ${appointmentDetails.carModel}!

📅 APPOINTMENT DETAILS:
Date: ${appointmentDetails.date}
Time: ${appointmentDetails.time}
Vehicle: ${appointmentDetails.carModel}
Location: Premier Auto Sales
         123 Main Street, Your City, ST 12345
Sales Representative: Sarah Johnson

WHAT TO BRING:
- Valid driver's license
- Proof of insurance (for test drive)
- Any trade-in vehicle information

If you need to reschedule or have any questions, please call us at (123) 456-7890.

Looking forward to seeing you!

Best regards,
Sarah Johnson
Premier Auto Sales
(123) 456-7890
    `;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Email service not configured - Gmail credentials missing'
      };
    }

    try {
      await this.transporter.verify();
      sheetsLogger.info('Email configuration test successful');
      return { success: true };
    } catch (error) {
      sheetsLogger.error('Email configuration test failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
