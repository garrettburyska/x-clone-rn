import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Comment from '../../models/comment.model.js';
import User from '../../models/user.model.js';
import Post from '../../models/post.model.js';

describe('Comment Model', () => {
  let mongoServer;
  let testUser;
  let testPost;

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

    testPost = await Post.create({
      user: testUser._id,
      content: 'Test post for comments',
    });
  });

  afterEach(async () => {
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid comment with all required fields', async () => {
      const validComment = {
        user: testUser._id,
        post: testPost._id,
        content: 'This is a test comment',
      };

      const comment = new Comment(validComment);
      const savedComment = await comment.save();

      expect(savedComment._id).toBeDefined();
      expect(savedComment.user.toString()).toBe(testUser._id.toString());
      expect(savedComment.post.toString()).toBe(testPost._id.toString());
      expect(savedComment.content).toBe(validComment.content);
      expect(savedComment.createdAt).toBeDefined();
      expect(savedComment.updatedAt).toBeDefined();
    });

    test('should fail validation without user field', async () => {
      const commentWithoutUser = {
        post: testPost._id,
        content: 'Comment without user',
      };

      const comment = new Comment(commentWithoutUser);
      await expect(comment.save()).rejects.toThrow();
    });

    test('should fail validation without post field', async () => {
      const commentWithoutPost = {
        user: testUser._id,
        content: 'Comment without post',
      };

      const comment = new Comment(commentWithoutPost);
      await expect(comment.save()).rejects.toThrow();
    });

    test('should fail validation without content field', async () => {
      const commentWithoutContent = {
        user: testUser._id,
        post: testPost._id,
      };

      const comment = new Comment(commentWithoutContent);
      await expect(comment.save()).rejects.toThrow();
    });

    test('should enforce content maxLength of 280 characters', async () => {
      const longContent = 'a'.repeat(281);
      const comment = new Comment({
        user: testUser._id,
        post: testPost._id,
        content: longContent,
      });

      await expect(comment.save()).rejects.toThrow();
    });

    test('should accept content with exactly 280 characters', async () => {
      const exactContent = 'a'.repeat(280);
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: exactContent,
      });

      expect(comment.content).toBe(exactContent);
      expect(comment.content.length).toBe(280);
    });

    test('should initialize likes as empty array', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment with no likes',
      });

      expect(comment.likes).toEqual([]);
      expect(comment.likes).toHaveLength(0);
    });
  });

  describe('Relationships', () => {
    test('should reference user correctly', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const populatedComment = await Comment.findById(comment._id).populate('user');
      expect(populatedComment.user.username).toBe('testuser');
      expect(populatedComment.user.emails).toBe('testuser@example.com');
    });

    test('should reference post correctly', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const populatedComment = await Comment.findById(comment._id).populate('post');
      expect(populatedComment.post.content).toBe('Test post for comments');
    });

    test('should handle likes array with single user', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const liker = await User.create({
        clerkId: 'clerk_liker',
        emails: 'liker@example.com',
        firstName: 'Liker',
        lastName: 'User',
        username: 'liker',
      });

      comment.likes.push(liker._id);
      const savedComment = await comment.save();

      expect(savedComment.likes).toHaveLength(1);
      expect(savedComment.likes[0].toString()).toBe(liker._id.toString());
    });

    test('should handle multiple likes', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Popular comment',
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

      comment.likes.push(...likerIds);
      const savedComment = await comment.save();

      expect(savedComment.likes).toHaveLength(5);
    });

    test('should populate likes correctly', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const liker = await User.create({
        clerkId: 'clerk_liker',
        emails: 'liker@example.com',
        firstName: 'Liker',
        lastName: 'User',
        username: 'liker',
      });

      comment.likes.push(liker._id);
      await comment.save();

      const populatedComment = await Comment.findById(comment._id).populate('likes');
      expect(populatedComment.likes[0].username).toBe('liker');
    });

    test('should populate both user and post', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const populatedComment = await Comment.findById(comment._id)
        .populate('user')
        .populate('post');

      expect(populatedComment.user.username).toBe('testuser');
      expect(populatedComment.post.content).toBe('Test post for comments');
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt timestamps', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeDefined();
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when comment is modified', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Original content',
      });

      const originalUpdatedAt = comment.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      comment.content = 'Updated content';
      await comment.save();

      expect(comment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in content', async () => {
      const specialContent = 'Comment with émojis 🎉🎊 and special chars! @#$%';
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: specialContent,
      });

      expect(comment.content).toBe(specialContent);
      expect(comment.content).toContain('🎉');
    });

    test('should handle URLs in content', async () => {
      const contentWithUrl = 'Check out https://example.com for more info!';
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: contentWithUrl,
      });

      expect(comment.content).toContain('https://example.com');
    });

    test('should handle multiline content', async () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: multilineContent,
      });

      expect(comment.content).toBe(multilineContent);
      expect(comment.content.split('\n')).toHaveLength(3);
    });

    test('should handle mentions and hashtags', async () => {
      const contentWithMentions = '@testuser This is great! #awesome #amazing';
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: contentWithMentions,
      });

      expect(comment.content).toContain('@testuser');
      expect(comment.content).toContain('#awesome');
    });

    test('should handle duplicate likes (same user)', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const liker = await User.create({
        clerkId: 'clerk_liker',
        emails: 'liker@example.com',
        firstName: 'Liker',
        lastName: 'User',
        username: 'liker',
      });

      comment.likes.push(liker._id);
      comment.likes.push(liker._id);
      const savedComment = await comment.save();

      // Mongoose doesn't prevent duplicates in arrays by default
      expect(savedComment.likes).toHaveLength(2);
    });

    test('should handle comment on own post', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Commenting on my own post',
      });

      expect(comment.user.toString()).toBe(testPost.user.toString());
    });
  });

  describe('Query Operations', () => {
    test('should find comments by user', async () => {
      await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment 1',
      });

      await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment 2',
      });

      const userComments = await Comment.find({ user: testUser._id });
      expect(userComments).toHaveLength(2);
    });

    test('should find comments by post', async () => {
      await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment 1',
      });

      await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment 2',
      });

      const postComments = await Comment.find({ post: testPost._id });
      expect(postComments).toHaveLength(2);
    });

    test('should sort comments by createdAt', async () => {
      const comment1 = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'First comment',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const comment2 = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Second comment',
      });

      const comments = await Comment.find().sort({ createdAt: -1 });
      expect(comments[0]._id.toString()).toBe(comment2._id.toString());
      expect(comments[1]._id.toString()).toBe(comment1._id.toString());
    });

    test('should count likes correctly', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment with likes',
      });

      for (let i = 1; i <= 3; i++) {
        const liker = await User.create({
          clerkId: `clerk_liker${i}`,
          emails: `liker${i}@example.com`,
          firstName: 'Liker',
          lastName: `${i}`,
          username: `liker${i}`,
        });
        comment.likes.push(liker._id);
      }

      await comment.save();

      const savedComment = await Comment.findById(comment._id);
      expect(savedComment.likes.length).toBe(3);
    });

    test('should handle multiple comments on same post by different users', async () => {
      const user2 = await User.create({
        clerkId: 'clerk_user2',
        emails: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        username: 'user2',
      });

      await Comment.create({
        user: testUser._id,
        post: testPost._id,
        content: 'Comment by user 1',
      });

      await Comment.create({
        user: user2._id,
        post: testPost._id,
        content: 'Comment by user 2',
      });

      const postComments = await Comment.find({ post: testPost._id });
      expect(postComments).toHaveLength(2);
      
      const userIds = postComments.map(c => c.user.toString());
      expect(userIds).toContain(testUser._id.toString());
      expect(userIds).toContain(user2._id.toString());
    });
  });
});