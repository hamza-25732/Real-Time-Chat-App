import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export const MESSAGE_MAX_LENGTH = 4000;

/**
 * The single conversation every message currently belongs to.
 *
 * A placeholder for real conversations: when the `Conversation` model lands,
 * `conversationId` becomes an ObjectId ref and existing rows need migrating
 * off this literal.
 */
export const GLOBAL_CONVERSATION_ID = 'global';

/** Shape of a message document as stored in the `messages` collection. */
export interface Message {
  /** Conversation key — `GLOBAL_CONVERSATION_ID` until conversations exist. */
  conversationId: string;
  /**
   * Author. Always set for a human message; `null` for a bot message, which
   * has no user account behind it.
   */
  senderId: Types.ObjectId | null;
  /**
   * The author's username at send time, denormalised so rendering history does
   * not need a populate on every row.
   */
  senderName: string;
  /** True for an assistant reply. The only case where `senderId` may be null. */
  isBot: boolean;
  /** Connection the message came from, used to group a sender's own messages. */
  socketId: string;
  content: string;
  /** Users who have read the message. */
  readBy: Types.ObjectId[];
  /** Set when the message body is edited, `null` for untouched messages. */
  editedAt: Date | null;
  /** Soft delete — the row stays so conversation history keeps its ordering. */
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<Message>;

type MessageModelDefinition = Model<Message>;

const messageSchema = new Schema<Message, MessageModelDefinition>(
  {
    conversationId: {
      type: String,
      required: [true, 'conversationId is required'],
      trim: true,
      default: GLOBAL_CONVERSATION_ID,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // Conditionally required: a human message must name its author, a bot
      // message has none. Written as a function so the rule lives with the
      // schema rather than in every caller.
      required: [
        function requiresSender(this: Message): boolean {
          return !this.isBot;
        },
        'senderId is required unless the message is from a bot',
      ],
      default: null,
      index: true,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    senderName: {
      type: String,
      required: [true, 'senderName is required'],
      trim: true,
      maxlength: [32, 'senderName must be at most 32 characters'],
    },
    socketId: {
      type: String,
      required: [true, 'socketId is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [MESSAGE_MAX_LENGTH, `Message must be at most ${MESSAGE_MAX_LENGTH} characters`],
    },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, plainObject): Record<string, unknown> => {
        const serialized = plainObject as Record<string, unknown>;
        delete serialized.__v;
        return serialized;
      },
    },
  },
);

/** Backs the primary read path: one conversation's history, newest first. */
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<Message, MessageModelDefinition>('Message', messageSchema);

export default Message;
