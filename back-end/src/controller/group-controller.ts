import { NextFunction, Request, Response } from "express"
import { getRepository } from "typeorm"
import { Group } from "../entity/group.entity"
import { CreateGroupDto, UpdateGroupDto } from "../interface/group.interface"
import { plainToClass} from "class-transformer"
import { validate } from "class-validator"

export class GroupController {
  private groupRepository = getRepository(Group)

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
    // Task 1: 
        
    // Return the list of Students that are in a Group
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
  
    // 1. Clear out the groups (delete all the students from the groups)

    // 2. For each group, query the student rolls to see which students match the filter for the group

    // 3. Add the list of students that match the filter to the group
  }
}
