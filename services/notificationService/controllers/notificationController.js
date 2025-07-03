const AWS = require('aws-sdk');
const twilio = require('twilio');
const db = require('../db'); // Assuming a db module exists

// Configure AWS SES
const ses = new AWS.SES({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Configure Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendEmailNotification = async (req, res) => {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).send('Missing required fields: to, subject, body');
    }

    const params = {
        Destination: { ToAddresses: [to] },
        Message: {
            Body: { Html: { Data: body } },
            Subject: { Data: subject }
        },
        Source: process.env.SENDER_EMAIL, // Your verified sender email
    };

    try {
        await ses.sendEmail(params).promise();
        // Optionally, save the notification to the database
        res.status(200).send({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send email');
    }
};

const sendSmsNotification = async (req, res) => {
    const { to, body } = req.body;

    if (!to || !body) {
        return res.status(400).send('Missing required fields: to, body');
    }

    try {
        await twilioClient.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        // Optionally, save the notification to the database
        res.status(200).send({ message: 'SMS sent successfully' });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).send('Failed to send SMS');
    }
};

const getNotificationsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // This assumes you have a 'notifications' table
        const { rows } = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Failed to fetch notifications');
    }
};


module.exports = {
    sendEmailNotification,
    sendSmsNotification,
    getNotificationsByUser
}; 