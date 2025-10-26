import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from "typeorm";
import { Item } from "./item.entity";

export type RelationshipType = "ask_to_commitment" | "commitment_to_action";

@Entity("relationships")
@Check(`"relationshipType" IN ('ask_to_commitment', 'commitment_to_action')`)
@Check(`"confidenceScore" >= 0 AND "confidenceScore" <= 1`)
@Check(`"parentItemId" <> "childItemId"`)
export class Relationship {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  @Index("idx_relationships_parent")
  parentItemId: string;

  @Column({ type: "uuid", nullable: false })
  @Index("idx_relationships_child")
  childItemId: string;

  @Column({
    type: "enum",
    enum: ["ask_to_commitment", "commitment_to_action"],
    nullable: false,
  })
  relationshipType: RelationshipType;

  @Column({
    type: "decimal",
    precision: 3,
    scale: 2,
    nullable: false,
  })
  confidenceScore: number;

  @CreateDateColumn({
    type: "timestamp with time zone",
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(() => Item, (item) => item.childRelationships, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentItemId" })
  parentItem: Item;

  @ManyToOne(() => Item, (item) => item.parentRelationships, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "childItemId" })
  childItem: Item;
}
