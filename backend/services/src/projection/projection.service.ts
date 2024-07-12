import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { instanceToPlain, plainToClass } from "class-transformer";
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { HelperService } from '../util/helpers.service';
import { User } from '../entities/user.entity';
import { ProjectionEntity } from '../entities/projection.entity';
import { ProjectionDto } from '../dtos/projection.dto';
import { ProjectionType } from '../enums/projection.enum';
import { GHGRecordState } from '../enums/ghg.state.enum';

@Injectable()
export class GhgProjectionService {

    constructor(
        private logger: Logger,
        @InjectEntityManager() private entityManager: EntityManager,
        @InjectRepository(ProjectionEntity) private projectionRepo: Repository<ProjectionEntity>,
        private helperService: HelperService,
    ) { };

    async create(projectionDto: ProjectionDto, user: User) {

      const projection: ProjectionEntity = this.toProjection(projectionDto);
      // this.verifyProjectionValues(projection);

      let savedProjection: ProjectionEntity;
      const result = await this.getActualProjection(projection.projectionType);

      if (result) {
          if (result.state === GHGRecordState.FINALIZED) {
              throw new HttpException(
                  this.helperService.formatReqMessagesString("ghgInventory.cannotEditProjectionFinalized", []),
                  HttpStatus.FORBIDDEN
              );
          }

          projection.id = result?.id;

          savedProjection = await this.entityManager
              .transaction(async (em) => {
                  const updatedData = await em.update<ProjectionEntity>(ProjectionEntity, {
                      id: projection.id,
                  },
                      {
                        projectionData: projection.projectionData,
                        state: projection.state,
                      });
                  return updatedData;
              })
              .catch((err: any) => {
                  console.log(err);
                  if (err instanceof QueryFailedError) {
                      throw new HttpException(this.helperService.formatReqMessagesString("ghgInventory.projectionUpdateFailed", []), HttpStatus.BAD_REQUEST);
                  } else {
                      this.logger.error(`Projection updating error ${err}`);
                  }
                  return err;
              });

          return { status: HttpStatus.OK, data: savedProjection };
      }

      savedProjection = await this.entityManager
          .transaction(async (em) => {
              const savedData = await em.save<ProjectionEntity>(projection);
              return savedData;
          })
          .catch((err: any) => {
              console.log(err);
              if (err instanceof QueryFailedError) {
                  throw new HttpException(this.helperService.formatReqMessagesString("ghgInventory.projectionSaveFailed", []), HttpStatus.BAD_REQUEST);
              } else {
                  this.logger.error(`Emission add error ${err}`);
              }
              return err;
          });

      return { status: HttpStatus.CREATED, data: savedProjection };
    }

    async getActualProjection(projectionType: string) {

        if (!Object.values(ProjectionType).includes(projectionType as ProjectionType)){
          throw new HttpException('Invalid Projection Type Received', HttpStatus.BAD_REQUEST);
        }

        return await this.projectionRepo.findOne({
            where: {
                projectionType: projectionType
            },
        });
    }

  //   async getCalculatedProjection(projectionType: string, projectionYear: string) {

  //     if (!Object.values(ProjectionType).includes(projectionType as ProjectionType)){
  //       throw new HttpException('Invalid Projection Type Received', HttpStatus.BAD_REQUEST);
  //     }

  //     if (!this.helperService.isValidYear(projectionYear)){
  //       throw new HttpException('Invalid Projection Year Received', HttpStatus.BAD_REQUEST);
  //     }

  //     const baselineYear = '2024'; // Set this later
  //     const yearDifference = parseInt(projectionYear) - parseInt(baselineYear);

  //     if (yearDifference < 0){
  //       throw new HttpException(`Projection Year Cannot be lower than the baseline year ${baselineYear}`, HttpStatus.BAD_REQUEST);
  //     }

  //     const baselineProjection =  await this.projectionRepo.findOne({
  //         where: {
  //             projectionType: projectionType,
  //             year: baselineYear,
  //         },
  //     });

  //     const calculatedProjection = {
  //       energyEmissions : {
  //         fuelCombustionActivities: this.calculateSectionProjection(yearDifference, baselineProjection.energyEmissions.fuelCombustionActivities),
  //         fugitiveEmissionsFromFuels: this.calculateSectionProjection(yearDifference, baselineProjection.energyEmissions.fugitiveEmissionsFromFuels),
  //         carbonDioxideTransportStorage: this.calculateSectionProjection(yearDifference, baselineProjection.energyEmissions.carbonDioxideTransportStorage),
  //       },
  //       industrialProcessesProductUse : this.calculateSectionProjection(yearDifference, baselineProjection.industrialProcessesProductUse),
  //       agricultureForestryOtherLandUse : this.calculateSectionProjection(yearDifference, baselineProjection.agricultureForestryOtherLandUse),
  //       waste : this.calculateSectionProjection(yearDifference, baselineProjection.waste),
  //       other : this.calculateSectionProjection(yearDifference, baselineProjection.other),
  //       totalCo2WithoutLand : this.calculateProjection(yearDifference, baselineProjection.totalCo2WithoutLand),
  //       totalCo2WithLand : this.calculateProjection(yearDifference, baselineProjection.totalCo2WithLand),
  //     }

  //     return calculatedProjection;
  // }

  // private calculateSectionProjection(yearDifference: number, sectionBaselineProjection: any){
  //   let calculatedSectionProjection = {};
  //   for (const [key, value] of Object.entries(sectionBaselineProjection)) {
  //     calculatedSectionProjection[key] = this.calculateProjection(yearDifference, value as ProjectionProperties)
  //   }

  //   return calculatedSectionProjection;
  // }

  // private calculateProjection(yearDifference: number, baselineProperty: ProjectionProperties){

  //   const growthRate: number = 2; // As a percentage would be 20% Per Year

  //   return {
  //     [ProjectionCategories.BAU] : baselineProperty.BAU * (Math.pow(growthRate, yearDifference)),
  //     [ProjectionCategories.CONDITIONAL_NDC] : baselineProperty.ConditionalNDC * (Math.pow(growthRate, yearDifference)),
  //     [ProjectionCategories.UNCONDITIONAL_NDC]: baselineProperty.UnconditionalNDC * (Math.pow(growthRate, yearDifference)),
  //   }
  // }

  private toProjection(projectionDto: ProjectionDto): ProjectionEntity {
      const data = instanceToPlain(projectionDto);
      this.logger.verbose("Converted projectionDto to Projection entity", JSON.stringify(data));
      return plainToClass(ProjectionEntity, data);
  }

  // private verifyProjectionValues(emissionData: any) {
  //     const projectionProperties = [ProjectionCategories.BAU, ProjectionCategories.CONDITIONAL_NDC, ProjectionCategories.UNCONDITIONAL_NDC];
  //     for (let key in emissionData) {
  //       if (typeof emissionData[key] === 'object') {
  //         if (!this.verifyProjectionValues(emissionData[key])) {
  //           return false;
  //         }
  //       } else {
  //         if (projectionProperties.includes(key as ProjectionCategories)) {
  //           if (typeof emissionData[key] === 'string') {
  //             throw new HttpException(this.helperService.formatReqMessagesString("ghgInventory.invalidDataType", []), HttpStatus.BAD_REQUEST);
  //           }
  //           if (typeof emissionData[key] === 'number' && emissionData[key] < 0) {
  //             throw new HttpException(this.helperService.formatReqMessagesString("ghgInventory.negativeValuesNotAllowed", []), HttpStatus.BAD_REQUEST);
  //           }
  //         }
    
  //       }
  //     }
  //     return true;
  // }
}