import { Entity, Column, ManyToOne, Check } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./item.entity";

export type RelationType = "ask_to_commitment" | "commitment_to_action";

@Entity()
@Check('"parent_item_id" != "child_item_id"')
export class Relationship extends BaseEntity {
  @ManyToOne(() => Item, (item) => item.child_relationships)
  parent_item: Item;

  @ManyToOne(() => Item, (item) => item.parent_relationships)
  child_item: Item;

  @Column({ type: "enum", enum: ["ask_to_commitment", "commitment_to_action"] })
  relationship_type: RelationType;

  @Column("float", {
    check: "confidence_score >= 0 AND confidence_score <= 1",
  })
  confidence_score: number;

  @Column("check", {
    expression: `
      (relationship_type = 'ask_to_commitment' AND
       parent_item.type = 'ask' AND 
       child_item.type = 'commitment')
      OR
      (relationship_type = 'commitment_to_action' AND
       parent_item.type = 'commitment' AND
       child_item.type = 'action')
    `,
  })
  validateTypes() {
    const valid =
      (this.relationship_type === "ask_to_commitment" &&
        this.parent_item.type === "ask" &&
        this.child_item.type === "commitment") ||
      (this.relationship_type === "commitment_to_action" &&
        this.parent_item.type === "commitment" &&
        this.child_item.type === "action");
    if (!valid) {
      throw new Error("Invalid relationship type combination");
    }
  }
}
