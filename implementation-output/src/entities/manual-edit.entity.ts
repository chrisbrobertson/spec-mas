import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Item } from "./item.entity";

@Entity("manual_edits")
export class ManualEdit {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  @Index("idx_manual_edits_item")
  itemId: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  fieldName: string;

  @Column({
    type: "jsonb",
    nullable: false,
  })
  oldValue: string;

  @Column({
    type: "jsonb",
    nullable: false,
  })
  newValue: string;

  @CreateDateColumn({
    type: "timestamp with time zone",
    nullable: false,
    name: "edited_at",
  })
  editedAt: Date;

  @ManyToOne(() => Item, (item) => item.manualEdits, { onDelete: "CASCADE" })
  @JoinColumn({ name: "itemId" })
  item: Item;
}
