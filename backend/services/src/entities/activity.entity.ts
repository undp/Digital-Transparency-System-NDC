import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { EntityType } from "../enums/shared.enum";
import { AchievementEntity } from "./achievement.entity";
import { SupportEntity } from "./support.entity";
import {
  Measure,
  TechnologyType,
  ImpleMeans,
  SupportType,
  ActivityStatus,
} from "../enums/activity.enum";
import { NatImplementor, IntImplementor } from "../enums/shared.enum";
import { Sector } from "../enums/sector.enum";

@Entity("activity")
export class ActivityEntity {
  @PrimaryColumn()
  activityId: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: "enum", enum: EntityType, nullable: true })
  parentType: string;

  @Column({ nullable: true })
  parentId: string;

  // @Column({ type: "enum", enum: SupportType, nullable: true })
  // supportType: string;

  @Column({ type: "enum", enum: Measure, nullable: true })
  measure: string;

  @Column({ type: "enum", enum: ActivityStatus })
  status: string;

  @Column("varchar", { array: true, nullable: true })
  internationalImplementingEntity: IntImplementor[];

  @Column("varchar", { array: true, nullable: true })
  nationalImplementingEntity: NatImplementor[];

  @Column({nullable: true})
  anchoredInNationalStrategy: boolean;

  @Column({ type: "enum", enum: ImpleMeans, nullable: true })
  meansOfImplementation: string;

  @Column({ type: "enum", enum: TechnologyType, nullable: true  })
  technologyType: string;

	@Column({ type: 'jsonb', nullable: true })
  documents: any;

  @Column({nullable: true})
  etfDescription: string;

	@Column()
  achievedGHGReduction: number;

  @Column()
  expectedGHGReduction: number;

  @Column()
  comment: string;

  @Column("jsonb", { nullable: true })
  mitigationInfo: any;

  @Column({ type: 'jsonb', nullable: true })
  mitigationTimeline: {
    expected: {
      baselineEmissions: number[];
      activityEmissionsWithM: number[];
      activityEmissionsWithAM: number[];
      expectedEmissionReductWithM: number[];
      expectedEmissionReductWithAM: number[];
    };
    actual: {
      baselineActualEmissions: number[];
      activityActualEmissions: number[];
      actualEmissionReduct: number[];
    };
  };

	@Column("varchar", { array: true, nullable: true })
  sectors: Sector[];

  @Column({ type: "ltree" })
  path: string;

  @OneToMany(
    () => AchievementEntity,
    (achievementEntity) => achievementEntity.activity
  )
  achievements?: AchievementEntity[];

  @OneToMany(() => SupportEntity, (supportEntity) => supportEntity.activity)
  support?: SupportEntity[];
}
