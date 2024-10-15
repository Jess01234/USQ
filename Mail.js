
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '202172005@uich.edu.mx',
        pass: '123456'
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendMail = (to, subject, text, res) => {
    const mailOptions = {
        from: '202172005@uich.edu.mx',
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.render('Error', {
                Warning: 'Error al enviar el correo: ' + error.message
            });
            return
        } else {
            res.render('Success', {
                message: 'Correo enviado correctamente.'
            });
            return
        }
    });
};

module.exports = sendMail;

