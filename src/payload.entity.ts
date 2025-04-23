import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;
}