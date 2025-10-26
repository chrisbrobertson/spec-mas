import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./Item.entity";

@Entity("manual_edits")
@Index("idx_manual_edits_item", ["item_id"])
export class ManualEdit extends BaseEntity {
  @Column({ type: "uuid", nullable: false })
  item_id: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  field_name: string;

  @Column({ type: "text", nullable: false })
  old_value: string;

  @Column({ type: "text", nullable: false })
  new_value: string;

  @Column({ type: "datetime", nullable: false })
  edited_at: Date;

  @ManyToOne(() => Item, (item) => item.manual_edits, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;
}
