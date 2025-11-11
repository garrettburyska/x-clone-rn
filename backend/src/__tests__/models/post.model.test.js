import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Post from '../../models/post.model.js';
import User from '../../models/user.model.js';
import Comment from '../../models/comment.model.js';

describe('Post Model', () => {
  let mongoServer;
  let testUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    testUser = await User.create({
      clerkId: 'clerk_testuser',
      emails: 'testuser@example.com',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
    });
  });

  afterEach(async () => {
    await Post.deleteMany({});
    await User.deleteMany({});
    await Comment.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid post with required fields', async () => {
      const validPost = {
        user: testUser._id,
        content: 'This is a test post',
      };

      const post = new Post(validPost);
      const savedPost = await post.save();

      expect(savedPost._id).toBeDefined();
      expect(savedPost.user.toString()).toBe(testUser._id.toString());
      expect(savedPost.content).toBe(validPost.content);
      expect(savedPost.createdAt).toBeDefined();
      expect(savedPost.updatedAt).toBeDefined();
    });

    test('should create post with content only', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Text only post',
      });

      expect(post.content).toBe('Text only post');
      expect(post.image).toBe('');
    });

    test('should create post with image only', async () => {
      const post = await Post.create({
        user: testUser._id,
        image: 'https://example.com/image.jpg',
      });

      expect(post.content).toBeUndefined();
      expect(post.image).toBe('https://example.com/image.jpg');
    });

    test('should create post with both content and image', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Post with image',
        image: 'https://example.com/photo.png',
      });

      expect(post.content).toBe('Post with image');
      expect(post.image).toBe('https://example.com/photo.png');
    });

    test('should set default empty string for image field', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Post without image',
      });

      expect(post.image).toBe('');
    });

    test('should fail validation without user field', async () => {
      const postWithoutUser = {
        content: 'Post without user',
      };

      const post = new Post(postWithoutUser);
      await expect(post.save()).rejects.toThrow();
    });

    test('should enforce content maxLength of 280 characters', async () => {
      const longContent = 'a'.repeat(281);
      const post = new Post({
        user: testUser._id,
        content: longContent,
      });

      await expect(post.save()).rejects.toThrow();
    });

    test('should accept content with exactly 280 characters', async () => {
      const exactContent = 'a'.repeat(280);
      const post = await Post.create({
        user: testUser._id,
        content: exactContent,
      });

      expect(post.content).toBe(exactContent);
      expect(post.content.length).toBe(280);
    });

    test('should initialize likes as empty array', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Post with no likes',
      });

      expect(post.likes).toEqual([]);
      expect(post.likes).toHaveLength(0);
    });

    test('should initialize comments as empty array', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Post with no comments',
      });

      expect(post.comments).toEqual([]);
      expect(post.comments).toHaveLength(0);
    });
  });

  describe('Relationships', () => {
    test('should reference user correctly', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      const populatedPost = await Post.findById(post._id).populate('user');
      expect(populatedPost.user.username).toBe('testuser');
      expect(populatedPost.user.emails).toBe('testuser@example.com');
    });

    test('should handle likes array with single user', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      const liker = await User.create({
        clerkId: 'clerk_liker',
        emails: 'liker@example.com',
        firstName: 'Liker',
        lastName: 'User',
        username: 'liker',
      });

      post.likes.push(liker._id);
      const savedPost = await post.save();

      expect(savedPost.likes).toHaveLength(1);
      expect(savedPost.likes[0].toString()).toBe(liker._id.toString());
    });

    test('should handle multiple likes', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Popular post',
      });

      const likerIds = [];
      for (let i = 1; i <= 5; i++) {
        const liker = await User.create({
          clerkId: `clerk_liker${i}`,
          emails: `liker${i}@example.com`,
          firstName: 'Liker',
          lastName: `${i}`,
          username: `liker${i}`,
        });
        likerIds.push(liker._id);
      }

      post.likes.push(...likerIds);
      const savedPost = await post.save();

      expect(savedPost.likes).toHaveLength(5);
    });

    test('should populate likes correctly', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      const liker = await User.create({
        clerkId: 'clerk_liker',
        emails: 'liker@example.com',
        firstName: 'Liker',
        lastName: 'User',
        username: 'liker',
      });

      post.likes.push(liker._id);
      await post.save();

      const populatedPost = await Post.findById(post._id).populate('likes');
      expect(populatedPost.likes[0].username).toBe('liker');
    });

    test('should handle comments array', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      const comment = await Comment.create({
        user: testUser._id,
        post: post._id,
        content: 'Test comment',
      });

      post.comments.push(comment._id);
      const savedPost = await post.save();

      expect(savedPost.comments).toHaveLength(1);
      expect(savedPost.comments[0].toString()).toBe(comment._id.toString());
    });

    test('should populate comments correctly', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      const comment = await Comment.create({
        user: testUser._id,
        post: post._id,
        content: 'Test comment',
      });

      post.comments.push(comment._id);
      await post.save();

      const populatedPost = await Post.findById(post._id).populate('comments');
      expect(populatedPost.comments[0].content).toBe('Test comment');
    });

    test('should handle multiple comments', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Post with comments',
      });

      const commentIds = [];
      for (let i = 1; i <= 3; i++) {
        const comment = await Comment.create({
          user: testUser._id,
          post: post._id,
          content: `Comment ${i}`,
        });
        commentIds.push(comment._id);
      }

      post.comments.push(...commentIds);
      const savedPost = await post.save();

      expect(savedPost.comments).toHaveLength(3);
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt timestamps', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      expect(post.createdAt).toBeDefined();
      expect(post.updatedAt).toBeDefined();
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when post is modified', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Original content',
      });

      const originalUpdatedAt = post.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      post.content = 'Updated content';
      await post.save();

      expect(post.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content string', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: '',
      });

      expect(post.content).toBe('');
    });

    test('should handle special characters in content', async () => {
      const specialContent = 'Post with émojis 🎉🎊 and special chars! @#$%';
      const post = await Post.create({
        user: testUser._id,
        content: specialContent,
      });

      expect(post.content).toBe(specialContent);
      expect(post.content).toContain('🎉');
    });

    test('should handle URLs in content', async () => {
      const contentWithUrl = 'Check out https://example.com for more info!';
      const post = await Post.create({
        user: testUser._id,
        content: contentWithUrl,
      });

      expect(post.content).toContain('https://example.com');
    });

    test('should handle multiline content', async () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const post = await Post.create({
        user: testUser._id,
        content: multilineContent,
      });

      expect(post.content).toBe(multilineContent);
      expect(post.content.split('\n')).toHaveLength(3);
    });

    test('should handle duplicate likes (same user)', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Test post',
      });

      const liker = await User.create({
        clerkId: 'clerk_liker',
        emails: 'liker@example.com',
        firstName: 'Liker',
        lastName: 'User',
        username: 'liker',
      });

      post.likes.push(liker._id);
      post.likes.push(liker._id);
      const savedPost = await post.save();

      // Mongoose doesn't prevent duplicates in arrays by default
      expect(savedPost.likes).toHaveLength(2);
    });

    test('should handle very long image URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
      const post = await Post.create({
        user: testUser._id,
        image: longUrl,
      });

      expect(post.image).toBe(longUrl);
      expect(post.image.length).toBeGreaterThan(500);
    });

    test('should allow post with neither content nor image', async () => {
      const post = await Post.create({
        user: testUser._id,
      });

      expect(post.content).toBeUndefined();
      expect(post.image).toBe('');
    });
  });

  describe('Query Operations', () => {
    test('should find posts by user', async () => {
      await Post.create({
        user: testUser._id,
        content: 'Post 1',
      });

      await Post.create({
        user: testUser._id,
        content: 'Post 2',
      });

      const userPosts = await Post.find({ user: testUser._id });
      expect(userPosts).toHaveLength(2);
    });

    test('should sort posts by createdAt', async () => {
      const post1 = await Post.create({
        user: testUser._id,
        content: 'First post',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const post2 = await Post.create({
        user: testUser._id,
        content: 'Second post',
      });

      const posts = await Post.find().sort({ createdAt: -1 });
      expect(posts[0]._id.toString()).toBe(post2._id.toString());
      expect(posts[1]._id.toString()).toBe(post1._id.toString());
    });

    test('should count likes correctly', async () => {
      const post = await Post.create({
        user: testUser._id,
        content: 'Post with likes',
      });

      for (let i = 1; i <= 3; i++) {
        const liker = await User.create({
          clerkId: `clerk_liker${i}`,
          emails: `liker${i}@example.com`,
          firstName: 'Liker',
          lastName: `${i}`,
          username: `liker${i}`,
        });
        post.likes.push(liker._id);
      }

      await post.save();

      const savedPost = await Post.findById(post._id);
      expect(savedPost.likes.length).toBe(3);
    });
  });
});