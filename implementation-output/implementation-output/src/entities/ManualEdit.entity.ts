import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./item.entity";

@Entity()
export class ManualEdit extends BaseEntity {
  @ManyToOne(() => Item, (item) => item.manual_edits)
  item: Item;

  @Column()
  field_name: string;

  @Column("json")
  old_value: string;

  @Column("json")
  new_value: string;

  @Column("timestamp")
  edited_at: Date;
}
