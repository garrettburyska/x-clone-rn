import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Notification from '../../models/notification.model.js';
import User from '../../models/user.model.js';
import Post from '../../models/post.model.js';
import Comment from '../../models/comment.model.js';

describe('Notification Model', () => {
  let mongoServer;
  let fromUser;
  let toUser;
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
    fromUser = await User.create({
      clerkId: 'clerk_fromuser',
      emails: 'fromuser@example.com',
      firstName: 'From',
      lastName: 'User',
      username: 'fromuser',
    });

    toUser = await User.create({
      clerkId: 'clerk_touser',
      emails: 'touser@example.com',
      firstName: 'To',
      lastName: 'User',
      username: 'touser',
    });

    testPost = await Post.create({
      user: toUser._id,
      content: 'Test post for notifications',
    });
  });

  afterEach(async () => {
    await Notification.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({});
    await Comment.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid follow notification', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification._id).toBeDefined();
      expect(notification.from.toString()).toBe(fromUser._id.toString());
      expect(notification.to.toString()).toBe(toUser._id.toString());
      expect(notification.type).toBe('follow');
      expect(notification.post).toBeNull();
      expect(notification.comment).toBeNull();
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
    });

    test('should create a valid like notification', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      expect(notification.type).toBe('like');
      expect(notification.post.toString()).toBe(testPost._id.toString());
      expect(notification.comment).toBeNull();
    });

    test('should create a valid comment notification', async () => {
      const comment = await Comment.create({
        user: fromUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'comment',
        post: testPost._id,
        comment: comment._id,
      });

      expect(notification.type).toBe('comment');
      expect(notification.post.toString()).toBe(testPost._id.toString());
      expect(notification.comment.toString()).toBe(comment._id.toString());
    });

    test('should fail validation without from field', async () => {
      const notification = new Notification({
        to: toUser._id,
        type: 'follow',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    test('should fail validation without to field', async () => {
      const notification = new Notification({
        from: fromUser._id,
        type: 'follow',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    test('should fail validation without type field', async () => {
      const notification = new Notification({
        from: fromUser._id,
        to: toUser._id,
      });

      await expect(notification.save()).rejects.toThrow();
    });

    test('should fail validation with invalid type', async () => {
      const notification = new Notification({
        from: fromUser._id,
        to: toUser._id,
        type: 'invalid_type',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    test('should only allow follow, like, or comment as type', async () => {
      const validTypes = ['follow', 'like', 'comment'];

      for (const type of validTypes) {
        const notification = await Notification.create({
          from: fromUser._id,
          to: toUser._id,
          type: type,
        });

        expect(notification.type).toBe(type);
      }
    });

    test('should set post to null by default', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification.post).toBeNull();
    });

    test('should set comment to null by default', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification.comment).toBeNull();
    });
  });

  describe('Relationships', () => {
    test('should reference from user correctly', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      const populated = await Notification.findById(notification._id).populate('from');
      expect(populated.from.username).toBe('fromuser');
      expect(populated.from.emails).toBe('fromuser@example.com');
    });

    test('should reference to user correctly', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      const populated = await Notification.findById(notification._id).populate('to');
      expect(populated.to.username).toBe('touser');
      expect(populated.to.emails).toBe('touser@example.com');
    });

    test('should reference post correctly', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      const populated = await Notification.findById(notification._id).populate('post');
      expect(populated.post.content).toBe('Test post for notifications');
    });

    test('should reference comment correctly', async () => {
      const comment = await Comment.create({
        user: fromUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'comment',
        comment: comment._id,
      });

      const populated = await Notification.findById(notification._id).populate('comment');
      expect(populated.comment.content).toBe('Test comment');
    });

    test('should populate all relationships', async () => {
      const comment = await Comment.create({
        user: fromUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'comment',
        post: testPost._id,
        comment: comment._id,
      });

      const populated = await Notification.findById(notification._id)
        .populate('from')
        .populate('to')
        .populate('post')
        .populate('comment');

      expect(populated.from.username).toBe('fromuser');
      expect(populated.to.username).toBe('touser');
      expect(populated.post.content).toBe('Test post for notifications');
      expect(populated.comment.content).toBe('Test comment');
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt timestamps', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when notification is modified', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
      });

      const originalUpdatedAt = notification.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      notification.type = 'follow';
      await notification.save();

      expect(notification.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Notification Types', () => {
    test('should handle follow notification correctly', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification.type).toBe('follow');
      expect(notification.post).toBeNull();
      expect(notification.comment).toBeNull();
    });

    test('should handle like notification with post', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      expect(notification.type).toBe('like');
      expect(notification.post).toBeDefined();
      expect(notification.comment).toBeNull();
    });

    test('should handle comment notification with post and comment', async () => {
      const comment = await Comment.create({
        user: fromUser._id,
        post: testPost._id,
        content: 'Test comment',
      });

      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'comment',
        post: testPost._id,
        comment: comment._id,
      });

      expect(notification.type).toBe('comment');
      expect(notification.post).toBeDefined();
      expect(notification.comment).toBeDefined();
    });
  });

  describe('Query Operations', () => {
    test('should find notifications by recipient', async () => {
      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      const notifications = await Notification.find({ to: toUser._id });
      expect(notifications).toHaveLength(2);
    });

    test('should find notifications by sender', async () => {
      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      const notifications = await Notification.find({ from: fromUser._id });
      expect(notifications).toHaveLength(1);
    });

    test('should find notifications by type', async () => {
      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      const followNotifications = await Notification.find({ type: 'follow' });
      expect(followNotifications).toHaveLength(1);
      expect(followNotifications[0].type).toBe('follow');
    });

    test('should sort notifications by createdAt', async () => {
      const notif1 = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const notif2 = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      const notifications = await Notification.find().sort({ createdAt: -1 });
      expect(notifications[0]._id.toString()).toBe(notif2._id.toString());
      expect(notifications[1]._id.toString()).toBe(notif1._id.toString());
    });

    test('should find notifications by post', async () => {
      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      const notifications = await Notification.find({ post: testPost._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('like');
    });
  });

  describe('Edge Cases', () => {
    test('should handle user notifying themselves', async () => {
      const notification = await Notification.create({
        from: toUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification.from.toString()).toBe(notification.to.toString());
    });

    test('should handle multiple notifications of same type between users', async () => {
      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: testPost._id,
      });

      const post2 = await Post.create({
        user: toUser._id,
        content: 'Another post',
      });

      await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
        post: post2._id,
      });

      const notifications = await Notification.find({
        from: fromUser._id,
        to: toUser._id,
        type: 'like',
      });

      expect(notifications).toHaveLength(2);
    });

    test('should allow null post for follow notifications', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
        post: null,
      });

      expect(notification.post).toBeNull();
    });

    test('should allow undefined post for follow notifications', async () => {
      const notification = await Notification.create({
        from: fromUser._id,
        to: toUser._id,
        type: 'follow',
      });

      expect(notification.post).toBeNull();
    });
  });
});