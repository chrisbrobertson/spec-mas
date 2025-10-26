import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Check,
  Unique,
} from "typeorm";
import { Item } from "./item.entity";

export type RelationshipType = "ask_to_commitment" | "commitment_to_action";

@Entity("relationships")
@Unique(["parentItemId", "childItemId"])
export class Relationship {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Item, (item) => item.childRelationships, { nullable: false })
  @JoinColumn({ name: "parent_item_id" })
  parentItem!: Item;

  @Column({ name: "parent_item_id", nullable: false })
  parentItemId!: string;

  @ManyToOne(() => Item, (item) => item.parentRelationships, {
    nullable: false,
  })
  @JoinColumn({ name: "child_item_id" })
  childItem!: Item;

  @Column({ name: "child_item_id", nullable: false })
  childItemId!: string;

  @Column({
    name: "relationship_type",
    type: "enum",
    enum: ["ask_to_commitment", "commitment_to_action"],
    nullable: false,
  })
  relationshipType!: RelationshipType;

  @Column({
    name: "confidence_score",
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: false,
  })
  @Check("confidence_score >= 0 AND confidence_score <= 1")
  confidenceScore!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  validate(): boolean {
    if (this.parentItemId === this.childItemId) {
      throw new Error("Self-referential relationships are not allowed");
    }

    if (this.confidenceScore < 0 || this.confidenceScore > 1) {
      throw new Error("Confidence score must be between 0 and 1");
    }

    return true;
  }
}
