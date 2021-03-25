import { Query, Resolver } from 'type-graphql';
import { version } from '../../../package.json';
import { getConnection } from 'typeorm';


@Resolver()
export class BaseResolver {

  @Query(returns => String)
  version() {

    return version;
  }

  @Query(returns => String)
  ping() {

    return getConnection().isConnected ? 'pong' : 'ping';
  }

}
