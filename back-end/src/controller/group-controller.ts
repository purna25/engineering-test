import { NextFunction, Request, Response } from "express"
import { Between, getRepository } from "typeorm"
import { Group } from "../entity/group.entity"
import { CreateGroupDto, UpdateGroupDto } from "../interface/group.interface"
import { GroupStudent } from "../entity/group-student.entity"
import { Student } from "../entity/student.entity"
import { CreateGroupStudentIncidentInput, UpdateGroupStudentIncidentInput } from "../interface/group-student.interface"
import { map } from "lodash"
import { Roll } from "../entity/roll.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { format, subWeeks, addMinutes } from "date-fns"
import { plainToClass} from "class-transformer"
import { validate } from "class-validator"

export class GroupController {
  private groupRepository = getRepository(Group)
  private groupStudentsRepository = getRepository(GroupStudent)
  private studentRepository = getRepository(Student)
  private rollRepository = getRepository(Roll)
  private studentRollStateRepository = getRepository(StudentRollState)

  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
    
    // Return the list of all groups
    return await this.groupRepository.find()
  }

  validateRollStatesInput = (rollStates: string) => {
    const acceptedRoles = ["unmark", "present", "absent", "late"] 
    let rollStatesArray = rollStates.split(",").map(o=> o.trim()).filter(o=> o !== "")
    for (let i=0; i < rollStatesArray.length; i++){
      if (!acceptedRoles.includes(rollStatesArray[i])) return false
    }
    return true
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
    
    // Add a Group
    const {body: params} = request;

    if (params.roll_states && !this.validateRollStatesInput(params.roll_states)) {
      response.status(400)
      return {"message": "roll_states contain invalid values"}
    }

    const createGroupInput = plainToClass(CreateGroupDto, params)
    let errors = await validate(createGroupInput)
    if (errors.length > 0){
      response.status(400)
      return errors
    } else {
      const group = new Group();
      group.prepareToCreate(createGroupInput);
      response.status(201)
      return await this.groupRepository.save(group);  
    }
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
    
    // Update a Group
    const {body: params} = request;

    if (params.roll_states && !this.validateRollStatesInput(params.roll_states)) {
      response.status(400)
      return {"message": "roll_states contain invalid values"}
    }

    const updateGroupInput = plainToClass(UpdateGroupDto, params)
    let errors = await validate(updateGroupInput)
    if (errors.length > 0){
      response.status(400)
      return errors
    }

    return await this.groupRepository.findOne(params.id).then((group) => {
      if (group) {
        group.prepareToUpdate(updateGroupInput);
        return this.groupRepository.save(group);  
      } else { return group}
    });
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
    
    // Delete a Group
    const {body: params} = request;
    if (params.id) {
      return await this.groupRepository.findOne(params.id).then((group) => {
        return group ? this.groupRepository.remove(group) : group
      })
    } else {
      return undefined
    }
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    return (
      await this.studentRepository.findByIds(
        (await this.groupStudentsRepository.find({group_id: request.params.id})).map(
          (groupStudent) => {return groupStudent.student_id}
        )
      )
    ).map((student)=>{
      if (student) {
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          full_name: `${student.first_name} ${student.last_name}`
        }  
      } else { return student }
    });
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
  
    // 1. Clear out the groups (delete all the students from the groups)
    (await this.groupStudentsRepository.find()).map((groupStudent) => {
      return this.groupStudentsRepository.remove(groupStudent)
    })

    // 2. For each group, query the student rolls to see which students match the filter for the group

    // get all studen ids
    const studentIds = (await this.studentRepository.find()).map((student) => {return student.id})

    // get all groups
    const groupsList = await this.groupRepository.find()

    let groupStudentInputs: CreateGroupStudentIncidentInput[] = []
    for (let i=0; i < groupsList.length; i++) {
      let group = groupsList[i]
      // Apply `number_of_weeks` filter of the group to get rolls
      const rollsInGroup = await this.rollRepository.find({where: {
        completed_at: this.fromWeeks(group.number_of_weeks)
      }})

      // get roll_states for those rolls
      var rollStatesInGroup: StudentRollState[] = []
      for (let j = 0; j < rollsInGroup.length; j++) {
        let roll = rollsInGroup[j]
        const rollStates = await this.studentRollStateRepository.find({where:{roll_id:roll.id}})
        rollStatesInGroup = rollStatesInGroup.concat(rollStates)
      }

      // Loop through students, and get his incidents from roll states
      let createGroupStudentInputs = studentIds.map((sId)=>{
        let studentRolls = rollStatesInGroup.filter((x)=> {return x.student_id==sId})

        let filterStates = group.roll_states
        let filterIncidentCount = group.incidents
        let filterLtmt = group.ltmt

        let incidents_count = 0
        for (let p=0; p < studentRolls.length; p++) {
          const studentRoll = studentRolls[p]
          // Applying `roll_states` filter of the group
          if (filterStates.includes(studentRoll.state)) {
            incidents_count += 1
          }
        }

        // Applying `ltmt` and `incidents` filters of the group
        if (filterLtmt === "<") {
          if (incidents_count <= filterIncidentCount) {
            const createGroupStudentIncidentInput: CreateGroupStudentIncidentInput = {
              student_id: sId,
              group_id: group.id,
              incident_count: incidents_count
            }
            const groupStudent = new GroupStudent()
            groupStudent.prepareToCreate(createGroupStudentIncidentInput)
            return groupStudent
          }
        } else if (filterLtmt === ">") {
          if(incidents_count >= filterIncidentCount) {
            const createGroupStudentIncidentInput: CreateGroupStudentIncidentInput = {
              student_id: sId,
              group_id: group.id,
              incident_count: incidents_count
            }
            const groupStudent = new GroupStudent()
            groupStudent.prepareToCreate(createGroupStudentIncidentInput)
            return groupStudent
          }
        }
        return undefined
      })

      createGroupStudentInputs = createGroupStudentInputs.filter((x)=>{return x !== undefined})

      const updateGroupInput: UpdateGroupDto = {
        student_count: createGroupStudentInputs.length,
        run_at: this.getNow()
      }
      group.prepareToUpdate(updateGroupInput)
      
    // 3. Add the list of students that match the filter to the group
    await this.funcCreateGroupStudentIncidents(createGroupStudentInputs)
      await this.groupRepository.save(group)
    }
    response.status(201)
    return groupsList
  }

  fromWeeks = (nWeeks: number) => {
    let date = new Date()
    return Between(
      format(subWeeks(date, nWeeks), 'yyyy-MM-dd HH:MM:SS'),
      format(date, 'yyyy-MM-dd HH:MM:SS')
    )
  }

  getNow = () => {return addMinutes(new Date(), 330)}

  async funcCreateGroupStudentIncidents(params: GroupStudent[]) {
    const studentGroupIncidents: GroupStudent[] = map(params, (param) => {
      const createStudentGroupIncidentInput: CreateGroupStudentIncidentInput = {
        student_id: param.student_id,
        group_id: param.group_id,
        incident_count: param.incident_count
      }

      const studentGroupIncident = new GroupStudent()
      studentGroupIncident.prepareToCreate(createStudentGroupIncidentInput)
      return studentGroupIncident
    })

    return await this.groupStudentsRepository.save(studentGroupIncidents)
  }

  async funcCreateGroupStudentIncident(params: GroupStudent) {
    const createStudentGroupIncidentInput: CreateGroupStudentIncidentInput = {
      student_id: params.student_id,
      group_id: params.group_id,
      incident_count: params.incident_count
    }

    const studentGroupIncident = new GroupStudent()
    studentGroupIncident.prepareToCreate(createStudentGroupIncidentInput)
    return await this.groupStudentsRepository.save(studentGroupIncident)
  }
}
