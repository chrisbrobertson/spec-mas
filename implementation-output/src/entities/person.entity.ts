import { Entity, Column, Index, OneToMany } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./Item.entity";

@Entity("persons")
export class Person extends BaseEntity {
  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true, unique: true })
  @Index("idx_person_email", { unique: true, where: "email IS NOT NULL" })
  email: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  @Index("idx_person_slack_id", {
    unique: true,
    where: "slack_user_id IS NOT NULL",
  })
  slack_user_id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  @Index("idx_person_zoom_id", {
    unique: true,
    where: "zoom_user_id IS NOT NULL",
  })
  zoom_user_id: string;

  @OneToMany(() => Item, (item) => item.responsible_person)
  items: Item[];
}
