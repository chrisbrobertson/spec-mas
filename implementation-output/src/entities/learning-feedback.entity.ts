import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Item } from "./item.entity";

export type FeedbackType =
  | "priority_correction"
  | "false_positive"
  | "relationship_correction";

@Entity("learning_feedback")
export class LearningFeedback {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Item, (item) => item.learningFeedback, { nullable: false })
  @JoinColumn({ name: "item_id" })
  item!: Item;

  @Column({ name: "item_id", nullable: false })
  itemId!: string;

  @Column({
    name: "feedback_type",
    type: "enum",
    enum: ["priority_correction", "false_positive", "relationship_correction"],
    nullable: false,
  })
  feedbackType!: FeedbackType;

  @Column({ name: "ai_prediction", type: "text", nullable: false })
  aiPrediction!: string;

  @Column({ name: "user_correction", type: "text", nullable: false })
  userCorrection!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  validate(): boolean {
    try {
      JSON.parse(this.aiPrediction);
      JSON.parse(this.userCorrection);
    } catch (e) {
      throw new Error("AI prediction and user correction must be valid JSON");
    }

    return true;
  }
}
