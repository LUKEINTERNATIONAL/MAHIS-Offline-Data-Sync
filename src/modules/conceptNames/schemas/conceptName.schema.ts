import { Column, Entity, ObjectId, ObjectIdColumn } from "typeorm";

@Entity()
export class ConceptName{

    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    concept_id: number;

    @Column()
    concept_name_id: number;

    @Column()
    name: string;

}