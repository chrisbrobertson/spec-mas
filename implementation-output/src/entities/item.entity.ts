import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from "typeorm";
import { Person } from "./person.entity";
import { Relationship } from "./relationship.entity";
import { ManualEdit } from "./manual-edit.entity";
import { LearningFeedback } from "./learning-feedback.entity";

export type ItemType = "ask" | "commitment" | "action";
export type Priority = "low" | "medium" | "high";
export type PrioritySource = "ai" | "manual";
export type Status = "pending" | "in_progress" | "completed" | "cancelled";
export type SourceType = "email" | "slack" | "zoom";

@Entity("items")
@Index(["sourceType", "sourceId"], { unique: true })
export class Item {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: ["ask", "commitment", "action"],
    nullable: false,
  })
  type!: ItemType;

  @Column({ length: 200, nullable: false })
  title!: string;

  @Column({ length: 2000, nullable: false })
  description!: string;

  @Column({
    type: "enum",
    enum: ["low", "medium", "high"],
    nullable: false,
  })
  priority!: Priority;

  @Column({
    name: "priority_source",
    type: "enum",
    enum: ["ai", "manual"],
    default: "ai",
  })
  prioritySource!: PrioritySource;

  @Column({
    type: "enum",
    enum: ["pending", "in_progress", "completed", "cancelled"],
    default: "pending",
  })
  status!: Status;

  @ManyToOne(() => Person, (person) => person.items, { nullable: false })
  @JoinColumn({ name: "responsible_person_id" })
  responsiblePerson!: Person;

  @Column({ name: "responsible_person_id", nullable: false })
  responsiblePersonId!: string;

  @Column({
    name: "confidence_score",
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: false,
  })
  @Check("confidence_score >= 0 AND confidence_score <= 1")
  confidenceScore!: number;

  @Column({
    name: "source_type",
    type: "enum",
    enum: ["email", "slack", "zoom"],
    nullable: false,
  })
  sourceType!: SourceType;

  @Column({ name: "source_id", length: 255, nullable: false })
  sourceId!: string;

  @Column({ name: "source_url", length: 1000, nullable: true })
  sourceUrl?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt!: Date;

  @Column({
    name: "due_date",
    type: "timestamp with time zone",
    nullable: true,
  })
  dueDate?: Date;

  @Column({
    name: "completed_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  completedAt?: Date;

  @Column({ name: "flagged_for_followup", type: "boolean", default: false })
  flaggedForFollowup!: boolean;

  @Column({
    name: "flagged_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  flaggedAt?: Date;

  @Column({ type: "boolean", default: false })
  archived!: boolean;

  @Column({
    name: "archived_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  archivedAt?: Date;

  @Column({ name: "historical_import", type: "boolean", default: false })
  historicalImport!: boolean;

  @OneToMany(() => Relationship, (relationship) => relationship.parentItem)
  childRelationships!: Relationship[];

  @OneToMany(() => Relationship, (relationship) => relationship.childItem)
  parentRelationships!: Relationship[];

  @OneToMany(() => ManualEdit, (manualEdit) => manualEdit.item)
  manualEdits!: ManualEdit[];

  @OneToMany(() => LearningFeedback, (feedback) => feedback.item)
  learningFeedback!: LearningFeedback[];

  validate(): boolean {
    if (!this.title?.trim() || this.title.length > 200) {
      throw new Error("Title is required and must be 200 characters or less");
    }

    if (!this.description?.trim() || this.description.length > 2000) {
      throw new Error(
        "Description is required and must be 2000 characters or less",
      );
    }

    if (this.confidenceScore < 0 || this.confidenceScore > 1) {
      throw new Error("Confidence score must be between 0 and 1");
    }

    if (!this.sourceId?.trim()) {
      throw new Error("Source ID is required");
    }

    if (this.dueDate && this.dueDate <= new Date()) {
      throw new Error("Due date must be in the future");
    }

    if (this.status === "completed" && !this.completedAt) {
      throw new Error("Completed items must have a completed_at timestamp");
    }

    if (this.status !== "completed" && this.completedAt) {
      throw new Error("Only completed items can have a completed_at timestamp");
    }

    return true;
  }
}
