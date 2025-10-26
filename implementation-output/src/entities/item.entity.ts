import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Person } from "./Person.entity";
import { Relationship } from "./Relationship.entity";
import { ManualEdit } from "./ManualEdit.entity";
import { LearningFeedback } from "./LearningFeedback.entity";

export type ItemType = "ask" | "commitment" | "action";
export type ItemPriority = "low" | "medium" | "high";
export type ItemStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type SourceType = "email" | "slack" | "zoom";

@Entity("items")
@Index("idx_items_source", ["source_type", "source_id"], { unique: true })
@Index("idx_items_status", ["status"])
@Index("idx_items_priority", ["priority"])
@Index("idx_items_due_date", ["due_date"])
@Check(`"type" IN ('ask', 'commitment', 'action')`)
@Check(`"priority" IN ('low', 'medium', 'high')`)
@Check(`"status" IN ('pending', 'in_progress', 'completed', 'cancelled')`)
@Check(`"confidence_score" >= 0 AND "confidence_score" <= 1`)
export class Item extends BaseEntity {
  @Column({ type: "varchar", length: 200, nullable: false })
  title: string;

  @Column({ type: "text", nullable: false })
  description: string;

  @Column({ type: "varchar", length: 20, nullable: false })
  type: ItemType;

  @Column({ type: "varchar", length: 20, nullable: false })
  priority: ItemPriority;

  @Column({ type: "varchar", length: 10, nullable: false, default: "ai" })
  priority_source: "ai" | "manual";

  @Column({ type: "varchar", length: 20, nullable: false })
  status: ItemStatus;

  @Column({ type: "uuid", nullable: false })
  responsible_person_id: string;

  @ManyToOne(() => Person, (person) => person.items, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "responsible_person_id" })
  responsible_person: Person;

  @Column({ type: "decimal", precision: 3, scale: 2, nullable: false })
  confidence_score: number;

  @Column({ type: "varchar", length: 10, nullable: false })
  source_type: SourceType;

  @Column({ type: "varchar", length: 255, nullable: false })
  source_id: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  source_url: string;

  @Column({ type: "datetime", nullable: true })
  due_date: Date;

  @Column({ type: "datetime", nullable: true })
  completed_at: Date;

  @Column({ type: "boolean", default: false })
  flagged_for_followup: boolean;

  @Column({ type: "datetime", nullable: true })
  flagged_at: Date;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @Column({ type: "datetime", nullable: true })
  archived_at: Date;

  @Column({ type: "boolean", default: false })
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
