import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./Item.entity";

export type FeedbackType =
  | "priority_correction"
  | "false_positive"
  | "relationship_correction";

@Entity("learning_feedback")
@Index("idx_learning_feedback_item", ["item_id"])
@Check(
  `"feedback_type" IN ('priority_correction', 'false_positive', 'relationship_correction')`,
)
export class LearningFeedback extends BaseEntity {
  @Column({ type: "uuid", nullable: false })
  item_id: string;

  @Column({ type: "varchar", length: 30, nullable: false })
  feedback_type: FeedbackType;

  @Column({ type: "text", nullable: false })
  ai_prediction: string;

  @Column({ type: "text", nullable: false })
  user_correction: string;

  @ManyToOne(() => Item, (item) => item.learning_feedback, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "item_id" })
  item: Item;
}
