import bcrypt from "bcryptjs";

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function hash(password: string) {
  const rounds = getNumberOfRounds();
  return await bcrypt.hash(password, rounds);
}

async function compare(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
