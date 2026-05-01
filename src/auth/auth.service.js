import prisma from "../lib/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "./token.service.js";

const parseEnvList = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const resolveRole = (githubUser) => {
  const adminEmails = parseEnvList(process.env.ADMIN_EMAILS);
  const adminGithubIds = parseEnvList(process.env.ADMIN_GITHUB_IDS);
  const email = githubUser.email?.toLowerCase();
  const githubId = String(githubUser.id).toLowerCase();

  if ((email && adminEmails.includes(email)) || adminGithubIds.includes(githubId)) {
    return "admin";
  }

  return "analyst";
};

export const findOrCreateUser = async (githubUser) => {
  const email =
    githubUser.email ||
    `${githubUser.id}@github.local`;

  const githubId = String(githubUser.id);
  const role = resolveRole(githubUser);

  const name =
    githubUser.name ||
    githubUser.login ||
    "GitHub User";

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ githubId }, { email }]
    }
  });

  if (!user) {
    return prisma.user.create({
      data: {
        email,
        role,
        githubId,
        name
      }
    });
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      githubId,
      name
    }
  });
};

export const generateAuthSession = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id }
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id
    }
  });

  return { accessToken, refreshToken };
};
