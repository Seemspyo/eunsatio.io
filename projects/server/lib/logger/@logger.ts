export abstract class Logger {

  public abstract name: string;

  public abstract log(message: string): void|Promise<void>;

}
