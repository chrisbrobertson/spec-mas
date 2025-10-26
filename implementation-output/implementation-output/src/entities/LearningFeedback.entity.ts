import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./item.entity";

export type FeedbackType =
  | "priority_correction"
  | "false_positive"
  | "relationship_correction";

@Entity()
export class LearningFeedback extends BaseEntity {
  @ManyToOne(() => Item, (item) => item.learning_feedback)
  item: Item;

  @Column({
    type: "enum",
    enum: ["priority_correction", "false_positive", "relationship_correction"],
  })
  feedback_type: FeedbackType;

  @Column("json")
  ai_prediction: string;

  @Column("json")
  user_correction: string;
}
