import nodemailter from "nodemailer";

type TSendEmailOptions = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

const transporter = nodemailter.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT),
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

async function send(mailOptions: TSendEmailOptions) {
  await transporter.sendMail(mailOptions);
}

const email = {
  send,
};

export default email;
