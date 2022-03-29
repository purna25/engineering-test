import { IsDate, IsDateString, IsDefined, IsIn, IsInt, IsOptional, IsString } from "class-validator"

export class CreateGroupDto {

    @IsString()
    @IsDefined()
    name: string

    @IsInt()
    @IsDefined()
    number_of_weeks: number

    @IsString()
    @IsDefined()
    roll_states: string

    @IsInt()
    @IsDefined()
    incidents: number

    @IsIn(["<", ">"])
    @IsDefined()
    ltmt: string

    @IsOptional()
    @IsDateString()
    run_at?: Date

    @IsInt()
    @IsOptional()
    student_count?: number
}


export class UpdateGroupDto {

    @IsOptional()
    @IsInt()
    id?: number

    @IsString()
    @IsOptional()
    name?: string

    @IsInt()
    @IsOptional()
    number_of_weeks?: number

    @IsString()
    @IsOptional()
    roll_states?: string

    @IsInt()
    @IsOptional()
    incidents?: number

    @IsIn(["<", ">"])
    @IsOptional()
    ltmt?: string

    @IsOptional()
    @IsDateString()
    run_at?: Date

    @IsInt()
    @IsOptional()
    student_count?: number

}