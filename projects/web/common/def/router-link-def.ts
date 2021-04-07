import { Params, QueryParamsHandling } from '@angular/router';


export class RouterLinkDef {

  constructor(
    public link: string,
    public label: string,
    public queryParams?: Params,
    public queryParamsHandling?: QueryParamsHandling,
    public fragment?: string,
    public preserveFragment?: boolean,
    public tree?: string[]
  ) { }

}
