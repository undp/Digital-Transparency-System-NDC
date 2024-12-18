import { ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ProjectStatus } from "../enums/project.enum";
import { DocumentDto } from "./document.dto";
import { KpiDto } from "./kpi.dto";

export class ProjectDto {

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	programmeId: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	title: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	description: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	additionalProjectNumber: string;

	@IsNotEmpty()
	@IsEnum(ProjectStatus, {
		each: true,
		message: 'Invalid International Implementing Entity. Supported following entities:' + Object.values(ProjectStatus)
	})
	@ApiProperty({
		type: [String],
		enum: Object.values(ProjectStatus),
	})
	projectStatus: ProjectStatus;

	@IsNotEmpty()
	@IsNumber()
	@Min(2013)
	@Max(2049)
	@ApiProperty()
	startYear: number;

	@IsNotEmpty()
	@IsNumber()
	@Min(2014)
	@Max(2050)
	@ApiProperty()
	endYear: number;

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
	comment: string;

	@IsOptional()
	@ApiPropertyOptional()
	linkedActivities: string[];

	@IsOptional()
	@ApiPropertyOptional(
		{
			type: "array",
			example: [{
				name: "KPI 1",
				kpiUnit: "mWp-installed",
				creatorType: "project",
				expected: 100
			}],
			items: {
				$ref: getSchemaPath(KpiDto),
			},
		}
	)
	kpis: KpiDto[];

}