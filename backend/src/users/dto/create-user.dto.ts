import { Length, IsNotEmpty, IsEmail, IsUrl } from 'class-validator';
export class CreateUserDto {
  @Length(2, 30)
  username: string;
  @Length(2, 200)
  about: string;
  @IsUrl()
  avatar: string;
  @IsEmail()
  email: string;
  @IsNotEmpty()
  password: string;
}
