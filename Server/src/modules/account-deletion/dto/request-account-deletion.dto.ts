import {
  Equals,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RequestAccountDeletionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;

  @Equals('ELIMINAR')
  confirmation: 'ELIMINAR';
}

export class PublicAccountDeletionDto extends RequestAccountDeletionDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
}
