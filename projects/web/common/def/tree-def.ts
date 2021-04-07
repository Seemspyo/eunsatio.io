import { Params, QueryParamsHandling } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';


export interface TreeNode {

  type: 'simple';
  icon?: IconDefinition;
  label: string;
  tree?: string[];
  children?: TreeNode|RouterLinkTreeNode|OuterLinkTreeNode|ActionTreeNode[];

}

export interface RouterLinkTreeNode extends Omit<TreeNode, 'type'> {

  type: 'routerLink';
  link: string;
  queryParams?: Params;
  queryParamsHandling?: QueryParamsHandling;
  fragment?: string;
  preserveFragment?: boolean;

}

export interface OuterLinkTreeNode extends Omit<TreeNode, 'type'> {

  type: 'outerLink';
  href: string;
  target?: string;

}

export interface ActionTreeNode extends Omit<TreeNode, 'type'> {

  type: 'action';
  action: (event: MouseEvent) => void;

}
