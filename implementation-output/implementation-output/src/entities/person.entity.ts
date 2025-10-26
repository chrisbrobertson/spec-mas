import { Entity, Column, OneToMany, Index } from "typeorm";
import { BaseEntity } from "./Base.entity";
import { Item } from "./item.entity";

@Entity()
export class Person extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true, where: "email IS NOT NULL" })
  @Column({ nullable: true, length: 255 })
  email?: string;

  @Column({ nullable: true })
  slack_user_id?: string;

  @Column({ nullable: true })
  zoom_user_id?: string;

  @OneToMany(() => Item, (item) => item.responsible_person)
  items: Item[];

  @Column(
    'check ("email" IS NOT NULL OR "slack_user_id" IS NOT NULL OR "zoom_user_id" IS NOT NULL)',
  )
  validateIdentifiers() {
    if (!this.email && !this.slack_user_id && !this.zoom_user_id) {
      throw new Error(
        "Person must have at least one identifier (email, slack_user_id, or zoom_user_id)",
      );
    }
  }
}
