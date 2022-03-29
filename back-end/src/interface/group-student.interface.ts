export interface CreateGroupStudentIncidentInput{
    student_id: number
    group_id: number
    incident_count: number
}

export interface UpdateGroupStudentIncidentInput {
    id?: number
    student_id?: number
    group_id?: number
    incident_count?: number
}
