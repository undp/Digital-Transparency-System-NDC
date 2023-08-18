import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BuildingType } from "@undp/carbon-credit-calculator";
import { IsNotEmpty, IsPositive, IsNumber, IsEnum, IsOptional, IsString } from "class-validator";
import { GhgEmissionDataProperties } from "./ghgEmission.properties";

export class AdaptationProperties {
    
    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    implementingAgency: string;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    nationalPlanObjectives: string;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    nationalPlanCoverage: string;
    
    @IsNotEmpty()
    @ApiProperty()
    ghgEmissionsAvoided: GhgEmissionDataProperties;
    
    @IsNotEmpty()
    @ApiProperty()
    ghgEmissionsReduced:GhgEmissionDataProperties;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    includedInNAP: boolean;
}