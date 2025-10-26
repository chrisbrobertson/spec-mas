import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

export type JobType = "process_email" | "process_slack" | "process_zoom";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

@Entity("jobs")
@Index(["sourceId"], { unique: true })
export class Job {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "job_type",
    type: "enum",
    enum: ["process_email", "process_slack", "process_zoom"],
    nullable: false,
  })
  jobType!: JobType;

  @Column({ name: "source_id", length: 255, nullable: false })
  sourceId!: string;

  @Column({
    type: "enum",
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  })
  status!: JobStatus;

  @Column({ name: "retry_count", type: "integer", default: 0 })
  retryCount!: number;

  @Column({ type: "text", nullable: false })
  payload!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @Column({
    name: "started_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  startedAt?: Date;

  @Column({
    name: "completed_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  completedAt?: Date;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string;

  validate(): boolean {
    if (!this.sourceId?.trim()) {
      throw new Error("Source ID is required");
    }

    if (this.retryCount < 0 || this.retryCount > 3) {
      throw new Error("Retry count must be between 0 and 3");
    }

    try {
      JSON.parse(this.payload);
    } catch (e) {
      throw new Error("Payload must be valid JSON");
    }

    return true;
  }
}
