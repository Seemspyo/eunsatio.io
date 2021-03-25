import { fork } from 'child_process';
import { existsSync, watch } from 'fs';


export class ChildObserver {

  #refreshing = false;
  #bundlePath;
  process;
  #watcher;

  /**
   * 
   * @param { string } bundlePath bundle path
   * @param { boolean } watch whether enable watch mode default is `false`
   */
  constructor(bundlePath, watchMode = false) {
    if (!existsSync(bundlePath)) {

      throw new Error(`\`${ bundlePath }\` does not exists`);
    }

    this.process = fork(bundlePath);
    this.#bundlePath = bundlePath;

    if (watchMode) {

      console.log(`watch changes for ${ this.#bundlePath }`);

      this.process.once('exit', () => this.#onProcessExit());

      this.#watcher = this.#watch();

    }
  }

  destroy() {
    this.process.kill('SIGTERM');
    this.#watcher.close();
  }

  #watch() {
    
    return watch(this.#bundlePath, event => {

      if (event === 'change') {

        this.#handleChange();

      }
    });
  }

  #handleChange() {
    console.log(`refreshing ${ this.#bundlePath }...`);

    this.#refreshing = true;
    this.#watcher.close();
    this.process.kill('SIGTERM');

    this.process = fork(this.#bundlePath);
    this.process.once('exit', () => this.#onProcessExit());
    this.#watcher = this.#watch();
  }

  #onProcessExit() {
    if (!this.#refreshing) {

      this.#watcher.close();

    } else {

      this.#refreshing = false;

    }
  }

}
