import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { instanceToPlain } from "class-transformer";
import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { UserService } from "../user/user.service";
import { ConfigService } from "@nestjs/config";
import { PasswordResetService } from "../util/passwordReset.service";
import { AsyncAction, AsyncOperationsInterface } from "../async-operations/async-operations.interface";
import { PasswordHashService } from "../util/passwordHash.service";
import { AsyncActionType } from "../enums/async.action.type.enum";
import { BasicResponseDto } from "../dtos/basic.response.dto";
import { HelperService } from "../util/helpers.service";
import { JWTPayload } from "../dtos/jwt.payload";
import { EmailTemplates } from "../email/email.template";
import { API_KEY_SEPARATOR } from "../constants";
import { UserState } from "../enums/user.enum";
import { User } from "../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private helperService: HelperService,
    private passwordReset: PasswordResetService,
    public caslAbilityFactory: CaslAbilityFactory,
    private asyncOperationsInterface: AsyncOperationsInterface,
    private passwordHashService: PasswordHashService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    let validationResponse : {user: Omit<User, 'password'> | null; message: string};

    pass = this.passwordHashService.getPasswordHash(pass);
    const user = await this.userService.getUserCredentials(username?.toLowerCase());

    if (user) {
      if (user.state == UserState.ACTIVE) {
        if (user.password === pass) {
          const { password, ...result } = user;
          validationResponse = { user: result, message: 'Validated'};
        } else {
          validationResponse = {user : null, message: "incorrectPassword"}
        }
      } else {
        validationResponse = {user : null, message: "accountDeactivated"}
      }
    } else {
      validationResponse = {user : null, message: "invalidUsername"}
    }
    
    return validationResponse;
  }

  async validateApiKey(apiKey: string): Promise<any> {
    const parts = Buffer.from(apiKey, "base64")
      .toString("utf-8")
      .split(API_KEY_SEPARATOR);
    if (parts.length != 2) {
      return null;
    }
    const user = await this.userService.getUserCredentials(parts[0]?.toLowerCase());
    if (user && user.apiKey === apiKey) {
      const { password, apiKey, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = new JWTPayload(
      user.organisation,
      user.name,
      user.id,
      user.role,
			user.subRole,
			user.sector,
      user.email,
      user.validatePermission,
      user.subRolePermission,
      user.ghgInventoryPermission,
    );
    const ability = this.caslAbilityFactory.createForUser(user);
    return {
      access_token: this.jwtService.sign(instanceToPlain(payload)),
      role: user.role,
			subRole: user.subRole,
      id: user.id,
      name: user.name,
      company: user.organisation,
      ability: JSON.stringify(ability),
			sector: user.sector,
      userState: user.state,
      validatePermission: user.validatePermission,
      subRolePermission: user.subRolePermission,
      ghgInventoryPermission: user.ghgInventoryPermission,
    };
  }

  async forgotPassword(email: any) {
    const hostAddress = this.configService.get("host");
    const userDetails = await this.userService.findOne(email);
    if (userDetails && userDetails.state == UserState.ACTIVE) {
      console.table(userDetails);
      const requestId = this.helperService.generateRandomPassword();
      const date = Date.now();
      const expireDate = date + 3600 * 1000; // 1 hout expire time
      const passwordResetD = {
        email: email,
        token: requestId,
        expireTime: expireDate,
      };
      await this.passwordReset.deletePasswordResetD(email);
      await this.passwordReset.insertPasswordResetD(passwordResetD);

      const templateData = {
        name: userDetails.name,
        requestId: requestId,
        home: hostAddress,
        countryName: this.configService.get("systemCountryName"),
      };

      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: EmailTemplates.FORGOT_PASSOWRD.id,
          sender: email,
          subject: this.helperService.getEmailTemplateMessage(
            EmailTemplates.FORGOT_PASSOWRD["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            EmailTemplates.FORGOT_PASSOWRD["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);

      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.resetEmailSent", [])
      );
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.forgotPwdUserNotFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
  }
}