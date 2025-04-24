import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class Payload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column({ type: 'text', nullable: true })
  data: string;

  @Column({ nullable: true })
  timestamp: number;

  @Column({ nullable: true })
  @Index({ unique: true })
  patientID: string;

  @CreateDateColumn()
  createdAt: Date;
}