import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Item } from "./item.entity";

@Entity("manual_edits")
export class ManualEdit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Item, (item) => item.manualEdits, { nullable: false })
  @JoinColumn({ name: "item_id" })
  item!: Item;

  @Column({ name: "item_id", nullable: false })
  itemId!: string;

  @Column({ name: "field_name", length: 50, nullable: false })
  fieldName!: string;

  @Column({ name: "old_value", type: "text", nullable: false })
  oldValue!: string;

  @Column({ name: "new_value", type: "text", nullable: false })
  newValue!: string;

  @CreateDateColumn({ name: "edited_at", type: "timestamp with time zone" })
  editedAt!: Date;

  validate(): boolean {
    if (!this.fieldName?.trim()) {
      throw new Error("Field name is required");
    }

    try {
      JSON.parse(this.oldValue);
      JSON.parse(this.newValue);
    } catch (e) {
      throw new Error("Old and new values must be valid JSON");
    }

    return true;
  }
}
