export class EunFormMissingControlError extends Error {

  constructor(message = 'form field must have at least one control') {
    super(message);
  }

}
