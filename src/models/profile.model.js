import prisma from "../lib/prisma.js";
import { roundUpToTwoDecimalPlaces } from "../utils/helpers.js";

const PROFILE_SELECT = {
  id: true,
  name: true,
  gender: true,
  gender_probability: true,
  age: true,
  age_group: true,
  country_id: true,
  country_name: true,
  country_probability: true,
  created_at: true
};

const normalizeProfile = (profile) => {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    gender_probability: roundUpToTwoDecimalPlaces(profile.gender_probability),
    country_probability: roundUpToTwoDecimalPlaces(profile.country_probability),
    created_at:
      profile.created_at instanceof Date
        ? profile.created_at.toISOString()
        : profile.created_at
  };
};

const Profile = {
  async findByName(name) {
    const profile = await prisma.profile.findUnique({
      where: { name },
      select: PROFILE_SELECT
    });

    return normalizeProfile(profile);
  },

  async findById(id) {
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: PROFILE_SELECT
    });

    return normalizeProfile(profile);
  },

  async create(profile) {
    const createdProfile = await prisma.profile.create({
      data: {
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        gender_probability: profile.gender_probability,
        age: profile.age,
        age_group: profile.age_group,
        country_id: profile.country_id,
        country_name: profile.country_name,
        country_probability: profile.country_probability,
        created_at: new Date(profile.created_at)
      },
      select: PROFILE_SELECT
    });

    return normalizeProfile(createdProfile);
  },

  async findWithFilters({
    gender,
    age_group,
    country_id,
    min_age,
    max_age,
    min_gender_probability,
    min_country_probability,
    sort_by = "created_at",
    order = "desc",
    page = 1,
    limit = 10
  }) {
    const where = {};

    if (gender) {
      where.gender = Array.isArray(gender) ? { in: gender } : gender;
    }

    if (age_group) {
      where.age_group = age_group;
    }

    if (country_id) {
      where.country_id = country_id;
    }

    if (min_age !== undefined || max_age !== undefined) {
      where.age = {};

      if (min_age !== undefined) {
        where.age.gte = Number(min_age);
      }

      if (max_age !== undefined) {
        where.age.lte = Number(max_age);
      }
    }

    if (min_gender_probability !== undefined) {
      where.gender_probability = { gte: Number(min_gender_probability) };
    }

    if (min_country_probability !== undefined) {
      where.country_probability = { gte: Number(min_country_probability) };
    }

    const safeLimit = Math.min(Number(limit) || 10, 50);
    const safePage = Number(page) || 1;
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: {
          [sort_by]: order
        },
        skip,
        take: safeLimit,
        select: PROFILE_SELECT
      }),
      prisma.profile.count({ where })
    ]);

    return {
      data: data.map(normalizeProfile),
      total,
      page: safePage,
      limit: safeLimit
    };
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
