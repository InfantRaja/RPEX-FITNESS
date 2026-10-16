import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
}

export interface IAIConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  topic: 'general' | 'workout' | 'nutrition' | 'progress' | 'motivation';
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  language: { type: String, default: 'en' },
}, { _id: false });

const AIConversationSchema = new Schema<IAIConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Conversation', maxlength: 200 },
    messages: [ChatMessageSchema],
    topic: {
      type: String,
      enum: ['general', 'workout', 'nutrition', 'progress', 'motivation'],
      default: 'general',
    },
  },
  { timestamps: true }
);

AIConversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);
