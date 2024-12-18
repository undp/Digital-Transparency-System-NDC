import { ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ArrayMinSize, MaxLength, Min, Max } from 'class-validator';
import { SubSector, NatImplementor } from "../enums/shared.enum";
import { DocumentDto } from "./document.dto";
import { KpiDto } from "./kpi.dto";
import { ProgrammeStatus } from "../enums/programme-status.enum";

export class ProgrammeDto {

    programmeId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    title: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    description: string;
  
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    objective: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    actionId: string;
    
    @IsArray()
    @ArrayMinSize(1)
    @MaxLength(100, { each: true })
    @IsNotEmpty({ each: true })
    @IsEnum(SubSector, {
        each: true,
        message: 'Invalid Sub sector. Supported following sub sectors:' + Object.values(SubSector)
    })
    @ApiProperty({
      type: [String],
      enum: Object.values(SubSector),
    })
    affectedSubSector: SubSector[];

    @IsNotEmpty()
    @IsNumber()
    @Min(2013)
    @Max(2049)
    @ApiProperty()
    startYear: number;

    @IsArray()
    @ArrayMinSize(1)
    @MaxLength(100, { each: true })
    @IsNotEmpty({ each: true })
    @IsEnum(NatImplementor, {
        each: true,
        message: 'Invalid National Implementing Entity. Supported following entities:' + Object.values(NatImplementor)
    })
    @ApiProperty({
      type: [String],
      enum: Object.values(NatImplementor),
    })
    natImplementor: NatImplementor[];
  
    // @IsNotEmpty()
    // @IsNumber()
		// @IsTwoDecimalPoints()
    // @ApiProperty()
    // investment: number;

		@IsNotEmpty()
    @IsEnum(ProgrammeStatus, {
			each: true,
			message: 'Invalid Programme Status. Supported following status:' + Object.values(ProgrammeStatus)
	})
	@ApiProperty({
		type: [String],
		enum: Object.values(ProgrammeStatus),
	})
	programmeStatus: number;
  
  @IsOptional()
  @ApiPropertyOptional(
    {
      type: "array",
      example: [{
        title: "document 1",
        data: "base64 document string"
      }],
      items: {
        $ref: getSchemaPath(DocumentDto),
      },
    }
  )
  documents: DocumentDto[];

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  comments: string;


  @IsOptional()
  @ApiPropertyOptional()
  linkedProjects: string[];

  @IsOptional()
  @ApiPropertyOptional(
    {
      type: "array",
      example: [{
        name: "KPI 1",
        kpiUnit: "mWp-installed",
        creatorType: "programme",
        expected: 100
    }],
      items: {
        $ref: getSchemaPath(KpiDto),
      },
    }
  )
  kpis: KpiDto[];
}