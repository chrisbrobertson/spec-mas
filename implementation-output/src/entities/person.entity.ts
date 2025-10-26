import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Item } from "./item.entity";

@Entity("persons")
export class Person {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 100, nullable: false })
  name!: string;

  @Column({ length: 255, nullable: true, unique: true })
  email?: string;

  @Column({ length: 50, nullable: true })
  slack_user_id?: string;

  @Column({ length: 50, nullable: true })
  zoom_user_id?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt!: Date;

  @OneToMany(() => Item, (item) => item.responsiblePerson)
  items!: Item[];

  validate(): boolean {
    if (!this.name?.trim()) {
      throw new Error("Name is required");
    }

    if (this.name.length > 100) {
      throw new Error("Name must be 100 characters or less");
    }

    if (!this.email && !this.slack_user_id && !this.zoom_user_id) {
      throw new Error(
        "At least one identifier (email, slack_user_id, or zoom_user_id) must be provided",
      );
    }

    if (this.email && !this.validateEmail(this.email)) {
      throw new Error("Invalid email format");
    }

    return true;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
