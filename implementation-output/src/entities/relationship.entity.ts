import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./Item.entity";

export type RelationshipType = "ask_to_commitment" | "commitment_to_action";

@Entity("relationships")
@Index("idx_relationship_parent_child", ["parent_item_id", "child_item_id"], {
  unique: true,
})
@Check(`"relationship_type" IN ('ask_to_commitment', 'commitment_to_action')`)
@Check(`"confidence_score" >= 0 AND "confidence_score" <= 1`)
export class Relationship extends BaseEntity {
  @Column({ type: "uuid", nullable: false })
  parent_item_id: string;

  @Column({ type: "uuid", nullable: false })
  child_item_id: string;

  @Column({ type: "varchar", length: 30, nullable: false })
  relationship_type: RelationshipType;

  @Column({ type: "decimal", precision: 3, scale: 2, nullable: false })
  confidence_score: number;

  @ManyToOne(() => Item, (item) => item.child_relationships, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parent_item_id" })
  parent_item: Item;

  @ManyToOne(() => Item, (item) => item.parent_relationships, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "child_item_id" })
  child_item: Item;
}
