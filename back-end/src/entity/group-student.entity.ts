import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { CreateGroupStudentIncidentInput, UpdateGroupStudentIncidentInput } from "../interface/group-student.interface"

@Entity()
export class GroupStudent {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  student_id: number

  @Column()
  group_id: number

  @Column()
  incident_count: number

  public prepareToCreate(input: CreateGroupStudentIncidentInput) {
    this.student_id = input.student_id
    this.group_id = input.group_id
    this.incident_count = input.incident_count
  }

  public prepareToUpdate(input: UpdateGroupStudentIncidentInput) {
    if (input.student_id !== undefined) this.student_id = input.student_id
    if (input.group_id !== undefined) this.group_id = input.group_id
    if (input.incident_count !== undefined) this.incident_count = input.incident_count
  }
}
