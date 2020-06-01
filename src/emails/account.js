const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "ojn2014520@gmail.com",
    subject: "Welcome to the app, " + name,
    text: "Thank you for joining. Let me know how you get along with the app",
    html: "<h1>Welcome</h1> <p>testing</p>",
  });
};

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "ojn2014520@gmail.com",
    subject: "Sorry to see you are leaving, " + name,
    text: "May I know what can we improve to keep you?",
    html: "<h1>Cancelation</h1> <p>Your account is removed</p>",
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
