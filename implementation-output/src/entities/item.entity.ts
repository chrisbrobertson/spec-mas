import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
  Index,
} from "typeorm";
import { Person } from "./person.entity";
import { ManualEdit } from "./manual-edit.entity";
import { LearningFeedback } from "./learning-feedback.entity";
import { Relationship } from "./relationship.entity";

export type ItemType = "ask" | "commitment" | "action";
export type ItemPriority = "low" | "medium" | "high";
export type ItemPrioritySource = "ai" | "manual";
export type ItemStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type SourceType = "email" | "slack" | "zoom";

@Entity("items")
@Index("idx_items_source", ["sourceType", "sourceId"], { unique: true })
@Index("idx_items_priority", ["priority", "prioritySource"])
@Index("idx_items_status", ["status"])
@Index("idx_items_flagged", ["flaggedForFollowup"])
@Index("idx_items_archived", ["archived"])
@Check(`"confidenceScore" >= 0 AND "confidenceScore" <= 1`)
@Check(`"status" IN ('pending', 'in_progress', 'completed', 'cancelled')`)
@Check(`"priority" IN ('low', 'medium', 'high')`)
@Check(`"prioritySource" IN ('ai', 'manual')`)
@Check(`"type" IN ('ask', 'commitment', 'action')`)
export class Item {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ["ask", "commitment", "action"],
    nullable: false,
  })
  type: ItemType;

  @Column({
    type: "varchar",
    length: 200,
    nullable: false,
  })
  @Index("idx_items_title")
  title: string;

  @Column({
    type: "varchar",
    length: 2000,
    nullable: false,
  })
  description: string;

  @Column({
    type: "enum",
    enum: ["low", "medium", "high"],
    nullable: false,
  })
  priority: ItemPriority;

  @Column({
    type: "enum",
    enum: ["ai", "manual"],
    nullable: false,
    default: "ai",
  })
  prioritySource: ItemPrioritySource;

  @Column({
    type: "enum",
    enum: ["pending", "in_progress", "completed", "cancelled"],
    nullable: false,
    default: "pending",
  })
  status: ItemStatus;

  @Column({ type: "uuid", nullable: false })
  responsiblePersonId: string;

  @ManyToOne(() => Person, (person) => person.items, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "responsiblePersonId" })
  responsiblePerson: Person;

  @Column({
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: false,
  })
  confidenceScore: number;

  @Column({
    type: "enum",
    enum: ["email", "slack", "zoom"],
    nullable: false,
  })
  sourceType: SourceType;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  sourceId: string;

  @Column({
    type: "varchar",
    length: 2048,
    nullable: true,
  })
  sourceUrl: string | null;

  @Column({
    type: "timestamp with time zone",
    nullable: true,
  })
  dueDate: Date | null;

  @Column({
    type: "timestamp with time zone",
    nullable: true,
  })
  completedAt: Date | null;

  @Column({
    type: "boolean",
    default: false,
    nullable: false,
  })
  flaggedForFollowup: boolean;

  @Column({
    type: "timestamp with time zone",
    nullable: true,
  })
  flaggedAt: Date | null;

  @Column({
    type: "boolean",
    default: false,
    nullable: false,
  })
  archived: boolean;

  @Column({
    type: "timestamp with time zone",
    nullable: true,
  })
  archivedAt: Date | null;

  @Column({
    type: "boolean",
    default: false,
    nullable: false,
  })
  historicalImport: boolean;

  @CreateDateColumn({
    type: "timestamp with time zone",
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone",
    nullable: false,
  })
  updatedAt: Date;

  @OneToMany(() => ManualEdit, (edit) => edit.item)
  manualEdits: ManualEdit[];

  @OneToMany(() => LearningFeedback, (feedback) => feedback.item)
  learningFeedback: LearningFeedback[];

  @OneToMany(() => Relationship, (relationship) => relationship.parentItem)
  childRelationships: Relationship[];

  @OneToMany(() => Relationship, (relationship) => relationship.childItem)
  parentRelationships: Relationship[];
}
