import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/user.model.js';

describe('User Model', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid user with all required fields', async () => {
      const validUser = {
        clerkId: 'clerk_12345',
        emails: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
      };

      const user = new User(validUser);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.clerkId).toBe(validUser.clerkId);
      expect(savedUser.emails).toBe(validUser.emails);
      expect(savedUser.firstName).toBe(validUser.firstName);
      expect(savedUser.lastName).toBe(validUser.lastName);
      expect(savedUser.username).toBe(validUser.username);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should create user with optional fields', async () => {
      const userWithOptionals = {
        clerkId: 'clerk_67890',
        emails: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        profilePicture: 'https://example.com/pic.jpg',
        bannerImage: 'https://example.com/banner.jpg',
        bio: 'Software developer',
        location: 'San Francisco, CA',
      };

      const user = new User(userWithOptionals);
      const savedUser = await user.save();

      expect(savedUser.profilePicture).toBe(userWithOptionals.profilePicture);
      expect(savedUser.bannerImage).toBe(userWithOptionals.bannerImage);
      expect(savedUser.bio).toBe(userWithOptionals.bio);
      expect(savedUser.location).toBe(userWithOptionals.location);
    });

    test('should set default values for optional fields', async () => {
      const minimalUser = {
        clerkId: 'clerk_minimal',
        emails: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'Imal',
        username: 'minimal',
      };

      const user = new User(minimalUser);
      const savedUser = await user.save();

      expect(savedUser.profilePicture).toBe('');
      expect(savedUser.bannerImage).toBe('');
      expect(savedUser.bio).toBe('');
      expect(savedUser.location).toBe('');
      expect(savedUser.followers).toEqual([]);
      expect(savedUser.following).toEqual([]);
    });

    test('should fail validation without clerkId', async () => {
      const userWithoutClerkId = {
        emails: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
      };

      const user = new User(userWithoutClerkId);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation without emails', async () => {
      const userWithoutEmail = {
        clerkId: 'clerk_12345',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
      };

      const user = new User(userWithoutEmail);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation without firstName', async () => {
      const userWithoutFirstName = {
        clerkId: 'clerk_12345',
        emails: 'test@example.com',
        lastName: 'Doe',
        username: 'johndoe',
      };

      const user = new User(userWithoutFirstName);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation without lastName', async () => {
      const userWithoutLastName = {
        clerkId: 'clerk_12345',
        emails: 'test@example.com',
        firstName: 'John',
        username: 'johndoe',
      };

      const user = new User(userWithoutLastName);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation without username', async () => {
      const userWithoutUsername = {
        clerkId: 'clerk_12345',
        emails: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithoutUsername);
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique clerkId constraint', async () => {
      const user1 = new User({
        clerkId: 'clerk_unique',
        emails: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'user1',
      });
      await user1.save();

      const user2 = new User({
        clerkId: 'clerk_unique',
        emails: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce unique email constraint', async () => {
      const user1 = new User({
        clerkId: 'clerk_1',
        emails: 'duplicate@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'user1',
      });
      await user1.save();

      const user2 = new User({
        clerkId: 'clerk_2',
        emails: 'duplicate@example.com',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce unique username constraint', async () => {
      const user1 = new User({
        clerkId: 'clerk_1',
        emails: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'duplicateusername',
      });
      await user1.save();

      const user2 = new User({
        clerkId: 'clerk_2',
        emails: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        username: 'duplicateusername',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    test('should enforce bio maxLength of 160 characters', async () => {
      const longBio = 'a'.repeat(161);
      const user = new User({
        clerkId: 'clerk_longbio',
        emails: 'longbio@example.com',
        firstName: 'Long',
        lastName: 'Bio',
        username: 'longbio',
        bio: longBio,
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should accept bio with exactly 160 characters', async () => {
      const exactBio = 'a'.repeat(160);
      const user = new User({
        clerkId: 'clerk_exactbio',
        emails: 'exactbio@example.com',
        firstName: 'Exact',
        lastName: 'Bio',
        username: 'exactbio',
        bio: exactBio,
      });

      const savedUser = await user.save();
      expect(savedUser.bio).toBe(exactBio);
      expect(savedUser.bio.length).toBe(160);
    });
  });

  describe('Relationships', () => {
    test('should handle followers array', async () => {
      const user1 = await User.create({
        clerkId: 'clerk_user1',
        emails: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'user1',
      });

      const user2 = await User.create({
        clerkId: 'clerk_user2',
        emails: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2',
      });

      user1.followers.push(user2._id);
      const savedUser = await user1.save();

      expect(savedUser.followers).toHaveLength(1);
      expect(savedUser.followers[0].toString()).toBe(user2._id.toString());
    });

    test('should handle following array', async () => {
      const user1 = await User.create({
        clerkId: 'clerk_user1',
        emails: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'user1',
      });

      const user2 = await User.create({
        clerkId: 'clerk_user2',
        emails: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2',
      });

      user1.following.push(user2._id);
      const savedUser = await user1.save();

      expect(savedUser.following).toHaveLength(1);
      expect(savedUser.following[0].toString()).toBe(user2._id.toString());
    });

    test('should handle multiple followers', async () => {
      const user1 = await User.create({
        clerkId: 'clerk_user1',
        emails: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'user1',
      });

      const followerIds = [];
      for (let i = 2; i <= 5; i++) {
        const follower = await User.create({
          clerkId: `clerk_user${i}`,
          emails: `user${i}@example.com`,
          firstName: 'User',
          lastName: `${i}`,
          username: `user${i}`,
        });
        followerIds.push(follower._id);
      }

      user1.followers.push(...followerIds);
      const savedUser = await user1.save();

      expect(savedUser.followers).toHaveLength(4);
    });

    test('should populate followers correctly', async () => {
      const user1 = await User.create({
        clerkId: 'clerk_user1',
        emails: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        username: 'user1',
      });

      const follower = await User.create({
        clerkId: 'clerk_follower',
        emails: 'follower@example.com',
        firstName: 'Follower',
        lastName: 'User',
        username: 'follower',
      });

      user1.followers.push(follower._id);
      await user1.save();

      const populatedUser = await User.findById(user1._id).populate('followers');
      expect(populatedUser.followers[0].username).toBe('follower');
      expect(populatedUser.followers[0].emails).toBe('follower@example.com');
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt timestamps', async () => {
      const user = await User.create({
        clerkId: 'clerk_timestamp',
        emails: 'timestamp@example.com',
        firstName: 'Time',
        lastName: 'Stamp',
        username: 'timestamp',
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when user is modified', async () => {
      const user = await User.create({
        clerkId: 'clerk_update',
        emails: 'update@example.com',
        firstName: 'Update',
        lastName: 'Test',
        username: 'update',
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      user.bio = 'Updated bio';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings for optional fields', async () => {
      const user = await User.create({
        clerkId: 'clerk_empty',
        emails: 'empty@example.com',
        firstName: 'Empty',
        lastName: 'Fields',
        username: 'empty',
        profilePicture: '',
        bannerImage: '',
        bio: '',
        location: '',
      });

      expect(user.profilePicture).toBe('');
      expect(user.bannerImage).toBe('');
      expect(user.bio).toBe('');
      expect(user.location).toBe('');
    });

    test('should handle special characters in text fields', async () => {
      const user = await User.create({
        clerkId: 'clerk_special',
        emails: 'special+test@example.com',
        firstName: "O'Brien",
        lastName: 'Smith-Jones',
        username: 'user_name-123',
        bio: 'Bio with émojis 🎉 and special chars!',
        location: 'São Paulo, Brazil',
      });

      expect(user.emails).toBe('special+test@example.com');
      expect(user.firstName).toBe("O'Brien");
      expect(user.lastName).toBe('Smith-Jones');
      expect(user.username).toBe('user_name-123');
      expect(user.bio).toContain('🎉');
      expect(user.location).toBe('São Paulo, Brazil');
    });

    test('should handle URLs in profilePicture and bannerImage', async () => {
      const user = await User.create({
        clerkId: 'clerk_urls',
        emails: 'urls@example.com',
        firstName: 'URL',
        lastName: 'Test',
        username: 'urltest',
        profilePicture: 'https://cloudinary.com/profile/image.jpg',
        bannerImage: 'https://cloudinary.com/banner/image.png',
      });

      expect(user.profilePicture).toContain('https://');
      expect(user.bannerImage).toContain('https://');
    });

    test('should not allow null for required fields', async () => {
      const user = new User({
        clerkId: null,
        emails: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should handle self-referencing in followers/following', async () => {
      const user = await User.create({
        clerkId: 'clerk_self',
        emails: 'self@example.com',
        firstName: 'Self',
        lastName: 'Reference',
        username: 'selfref',
      });

      // A user could theoretically try to follow themselves
      user.following.push(user._id);
      const savedUser = await user.save();

      expect(savedUser.following).toHaveLength(1);
      expect(savedUser.following[0].toString()).toBe(user._id.toString());
    });
  });
});