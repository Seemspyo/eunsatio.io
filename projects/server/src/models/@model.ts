import { UserInputError } from 'apollo-server-errors';
import { validateOrReject } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';


export abstract class SelfValidator {

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    try {

      await validateOrReject(this);

    } catch (errors) {

      const { property: target, value } = errors[0];

      throw new UserInputError('invalid input', { target, value });
    }
  }

}
