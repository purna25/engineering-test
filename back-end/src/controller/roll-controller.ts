import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Roll } from "../entity/roll.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { CreateRollInput, UpdateRollInput } from "../interface/roll.interface"
import { CreateStudentRollStateInput, UpdateStudentRollStateInput } from "../interface/student-roll-state.interface"
import { map } from "lodash"

export class RollController {
  private rollRepository = getRepository(Roll)
  private studentRollStateRepository = getRepository(StudentRollState)

  async allRolls(request: Request, response: Response, next: NextFunction) {
    return await this.rollRepository.find()
  }

  async createRoll(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    const createRollInput: CreateRollInput = {
      name: params.name,
      completed_at: params.completed_at,
    }
    const roll = new Roll()
    roll.prepareToCreate(createRollInput)
    response.status(201)
    return await this.rollRepository.save(roll)
  }

  async updateRoll(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    return await this.rollRepository.findOne(params.id).then((roll) => {
      if (roll) {
        const updateRollInput: UpdateRollInput = {
          id: params.id,
          name: params.name,
          completed_at: params.completed_at,
        }
        roll.prepareToUpdate(updateRollInput)
        return this.rollRepository.save(roll)  
      } else {return roll}
    })
  }

  async removeRoll(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request
    if (params.id) {
      return await this.rollRepository.findOne(params.id).then((roll) => {
        return roll ? this.rollRepository.remove(roll) : roll
      })
    } else { return undefined }
  }

  async getRoll(request: Request, response: Response, next: NextFunction) {
    return await this.studentRollStateRepository.find({ roll_id: request.params.id })
  }

  async addStudentRollStates(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request
    const studentRollStates: StudentRollState[] = map(params, (param) => {
      const createStudentRollStateInput: CreateStudentRollStateInput = {
        roll_id: param.roll_id,
        student_id: param.student_id,
        state: param.state,
      }

      const studentRollState = new StudentRollState()
      studentRollState.prepareToCreate(createStudentRollStateInput)
      return studentRollState
    })

    response.status(201)
    return await this.studentRollStateRepository.save(studentRollStates)
  }

  async addStudentRollState(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    const createStudentRollStateInput: CreateStudentRollStateInput = {
      roll_id: params.roll_id,
      student_id: params.student_id,
      state: params.state,
    }
    const studentRollState = new StudentRollState()
    studentRollState.prepareToCreate(createStudentRollStateInput)

    response.status(201)
    return await this.studentRollStateRepository.save(studentRollState)
  }

  async updateStudentRollState(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    return await this.studentRollStateRepository.findOne(params.id).then((studentRollState) => {
      if (studentRollState) {
        const updateStudentRollStateInput: UpdateStudentRollStateInput = {
          id: params.id,
          roll_id: params.roll_id,
          student_id: params.student_id,
          state: params.state,
        }
        studentRollState.prepareToUpdate(updateStudentRollStateInput)
        return this.studentRollStateRepository.save(studentRollState)  
      } else { return studentRollState }
    })
  }
}
