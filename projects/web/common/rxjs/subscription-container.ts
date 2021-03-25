import {
  Injectable,
  isDevMode,
  OnDestroy
} from '@angular/core';
import { SubscriptionLike } from 'rxjs';


@Injectable()
export class SubscriptionContainer implements OnDestroy {

  private primaryKey = 0;
  private map = new Map<any, SubscriptionLike>();

  ngOnDestroy() {
    this.disposeAll();
  }

  public add(...subscriptions: SubscriptionLike[]) {
    const keys: number[] = []

    for (const sub of subscriptions) {
      const key = this.primaryKey++;
  
      this.map.set(key, sub);

      keys.push(key);
    }

    return keys;
  }

  public addBy(key: any, subscription: SubscriptionLike) {
    if (this.map.has(key)) {

      if (isDevMode()) {
        console.warn(`key \`${ key }\` already exists.`);
      }

      return false;
    }

    this.map.set(key, subscription);

    return true;
  }

  public get(key: any) {

    return this.map.get(key);
  }

  /**
   * @returns subscription
   */
  public remove(key: any) {
    const sub = this.map.get(key);

    if (sub) {
      this.map.delete(key);
    }

    return sub || null;
  }

  public clear() {
    this.map.clear();
    this.primaryKey = 0;
  }

  /**
   * @description unsubscribe with given key and remove it from the container
   */
  public dispose(key: any) {
    const
    sub = this.map.get(key),
    has = typeof sub?.unsubscribe === 'function';

    if (has) {
      sub!.unsubscribe();
      this.map.delete(key);
    }

    return has;
  }

  public disposeAll() {
    for (const [ , sub ] of this.map) sub.unsubscribe();

    this.clear();
  }
  
}
