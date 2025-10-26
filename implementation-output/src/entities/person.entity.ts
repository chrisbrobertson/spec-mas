import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Item } from "./item.entity";

@Entity("persons")
export class Person {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  @Index("idx_persons_name")
  name: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    unique: true,
  })
  @Index("idx_persons_email", { unique: true, where: "email IS NOT NULL" })
  email: string | null;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
  })
  @Index("idx_persons_slack", {
    unique: true,
    where: "slack_user_id IS NOT NULL",
  })
  slackUserId: string | null;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
  })
  @Index("idx_persons_zoom", {
    unique: true,
    where: "zoom_user_id IS NOT NULL",
  })
  zoomUserId: string | null;

  @CreateDateColumn({
    type: "timestamp with time zone",
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone",
    nullable: false,
  })
  updatedAt: Date;

  @OneToMany(() => Item, (item) => item.responsiblePerson)
  items: Item[];
}
