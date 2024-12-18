import { forwardRef, Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import * as path from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../configuration";
import { Counter } from "../entities/counter.entity";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { CounterService } from "./counter.service";
import { HelperService } from "./helpers.service";
import { PasswordReset } from "../entities/userPasswordResetToken.entity";
import { PasswordResetService } from "./passwordReset.service";
import { User } from "../entities/user.entity";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { ConfigurationSettingsService } from "./configurationSettings.service";
import { ConfigurationSettingsEntity } from "../entities/configuration.settings.entity";
import { PasswordHashService } from "./passwordHash.service";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { FileUploadService } from "./fileUpload.service";
import { LinkUnlinkService } from "./linkUnlink.service";
import { IsTwoDecimalPointsConstraint } from "./twoDecimalPointNumber.decorator";
import { DataExportService } from "./dataExport.service";
import { ActionEntity } from "../entities/action.entity";
import { ProgrammeEntity } from "../entities/programme.entity";
import { ProjectEntity } from "../entities/project.entity";
import { ActivityEntity } from "../entities/activity.entity";
import { ProjectionEntity } from "../entities/projection.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined,
    }),FileHandlerModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forFeature([
      Counter,
      PasswordReset,
      User,
      ConfigurationSettingsEntity,
			ActionEntity,
			ProgrammeEntity,
			ProjectEntity,
			ActivityEntity,
      ProjectionEntity
    ]),
    forwardRef(() => AsyncOperationsModule),
    FileHandlerModule,
  ],
  providers: [
    CounterService,
    HelperService,
    PasswordResetService,
    Logger,
    ConfigurationSettingsService,
    PasswordHashService,
    FileUploadService,
		LinkUnlinkService,
		IsTwoDecimalPointsConstraint,
		DataExportService,
  ],
  exports: [
    CounterService,
    HelperService,
    PasswordResetService,
    ConfigurationSettingsService,
    PasswordHashService,
    FileUploadService,
		LinkUnlinkService,
		DataExportService,
  ],
})
export class UtilModule {}
