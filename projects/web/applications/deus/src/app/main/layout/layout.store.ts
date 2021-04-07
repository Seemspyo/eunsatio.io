import { Injectable } from '@angular/core';
import {
  ActionTreeNode,
  OuterLinkTreeNode,
  RouterLinkTreeNode,
  TreeNode
} from 'common/def/tree-def';
import { BehaviorSubject } from 'rxjs';


export type Drawer = TreeNode|RouterLinkTreeNode|OuterLinkTreeNode|ActionTreeNode;

@Injectable()
export class LayoutStore {

  public drawer = new BehaviorSubject<Drawer[]>([]);

  public setDrawer(drawer: Drawer[]) {
    this.drawer.next(drawer);
  }

}
