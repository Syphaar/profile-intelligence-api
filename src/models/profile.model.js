import prisma from "../lib/prisma.js";

const normalizeProfile = (profile) => {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    created_at:
      profile.created_at instanceof Date
        ? profile.created_at.toISOString()
        : profile.created_at
  };
};

const Profile = {
  async findByName(name) {
    const profile = await prisma.profile.findUnique({
      where: { name }
    });

    return normalizeProfile(profile);
  },

  async findById(id) {
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    return normalizeProfile(profile);
  },

  async create(profile) {
    const createdProfile = await prisma.profile.create({
      data: {
        ...profile,
        created_at: new Date(profile.created_at)
      }
    });

    return normalizeProfile(createdProfile);
  },

  async findAll(filter = {}) {
    return prisma.profile.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        gender: true,
        age: true,
        age_group: true,
        country_id: true
      },
      orderBy: {
        created_at: "desc"
      }
    });
  },

  async deleteById(id) {
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!profile) {
      return null;
    }

    await prisma.profile.delete({
      where: { id }
    });

    return profile;
  }
};

export default Profile;
