import { Entity, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Person } from "./person.entity";
import { Relationship } from "./relationship.entity";
import { ManualEdit } from "./ManualEdit.entity";
import { LearningFeedback } from "./LearningFeedback.entity";

export type ItemType = "ask" | "commitment" | "action";
export type ItemPriority = "low" | "medium" | "high";
export type ItemStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type SourceType = "email" | "slack" | "zoom";
export type PrioritySource = "ai" | "manual";

@Entity()
export class Item extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ length: 2000 })
  description: string;

  @Column({ type: "enum", enum: ["ask", "commitment", "action"] })
  type: ItemType;

  @Column({ type: "enum", enum: ["low", "medium", "high"] })
  priority: ItemPriority;

  @Column({ type: "enum", enum: ["ai", "manual"] })
  priority_source: PrioritySource;

  @Column({
    type: "enum",
    enum: ["pending", "in_progress", "completed", "cancelled"],
  })
  status: ItemStatus;

  @ManyToOne(() => Person, (person) => person.items)
  responsible_person: Person;

  @Column("float", {
    check: "confidence_score >= 0 AND confidence_score <= 1",
  })
  confidence_score: number;

  @Column({ type: "enum", enum: ["email", "slack", "zoom"] })
  source_type: SourceType;

  @Index({ unique: true })
  @Column()
  source_id: string;

  @Column({ nullable: true })
  source_url?: string;

  @Column({ nullable: true, type: "timestamp" })
  due_date?: Date;

  @Column({ nullable: true, type: "timestamp" })
  completed_at?: Date;

  @Column({ default: false })
  flagged_for_followup: boolean;

  @Column({ nullable: true, type: "timestamp" })
  flagged_at?: Date;

  @Column({ default: false })
  archived: boolean;

  @Column({ nullable: true, type: "timestamp" })
  archived_at?: Date;

  @Column({ default: false })
  historical_import: boolean;

  @OneToMany(() => Relationship, (relationship) => relationship.parent_item)
  child_relationships: Relationship[];

  @OneToMany(() => Relationship, (relationship) => relationship.child_item)
  parent_relationships: Relationship[];

  @OneToMany(() => ManualEdit, (edit) => edit.item)
  manual_edits: ManualEdit[];

  @OneToMany(() => LearningFeedback, (feedback) => feedback.item)
  learning_feedback: LearningFeedback[];
}
