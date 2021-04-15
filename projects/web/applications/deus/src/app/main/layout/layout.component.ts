import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  faAngleDown,
  faCaretDown,
  faCog,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { AuthAPI } from 'common/api/auth-api';
import { APIErrorParser } from 'common/api/error-parser';
import { UserAPI } from 'common/api/user-api';
import { FlipBar } from 'common/flip-bar';
import { InventorySwitch } from 'common/inventory';
import { RouterLinkDef } from 'common/def/router-link-def';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router
} from '@angular/router';
import { SubscriptionContainer } from 'common/rxjs/subscription-container';
import { Drawer, LayoutStore } from './layout.store';
import {
  ActionTreeNode,
  OuterLinkTreeNode,
  RouterLinkTreeNode,
  TreeNode
} from 'common/def/tree-def';
import {
  UserRole,
  canManageUsers,
  canWriteBlogArticle
} from '@eunsatio.io/server';
import { trigger } from '@angular/animations';
import { fadeEnter, fadeLeave } from 'common/animations/fade';
import { BreakpointObserver } from '@angular/cdk/layout';
import { fromEvent } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { SwiperComponent } from 'swiper/angular';


type DrawerState = 'expanded'|'collapsed';

@Component({
  selector: 'layout',
  templateUrl: 'layout.component.html',
  styleUrls: [ 'layout.component.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'layout'
  },
  providers: [
    SubscriptionContainer
  ],
  animations: [
    trigger('fade', [
      fadeEnter,
      fadeLeave
    ])
  ]
})
export class LayoutComponent implements OnInit, AfterViewInit {

  public readonly icons = {
    title: faCog,
    out: faSignOutAlt,
    menu: faCaretDown,
    expand: faAngleDown
  }

  public user = this.authAPI.me!;
  public profileImagePlaceholder = this.userAPI.getProfileImagePlaceholder();

  public currentTree!: string[];
  public navigationDefs!: RouterLinkDef[];

  public drawer!: Drawer[];
  // public expandedDrawerSet = new Set<Drawer>();
  public drawerState: DrawerState = 'expanded';

  private processing = false;

  private isServer!: boolean;

  @ViewChild(InventorySwitch)
  inventorySwitch!: InventorySwitch;

  @ViewChild('headerRef')
  headerElRef!: ElementRef<HTMLElement>;

  @ViewChild('menuRef')
  menuElRef!: ElementRef<HTMLElement>;

  @ViewChild(SwiperComponent)
  swiperRef!: SwiperComponent;

  get swiperInstance() {

    return this.swiperRef.swiperRef;
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private authAPI: AuthAPI,
    private userAPI: UserAPI,
    private flipBar: FlipBar,
    private errorParser: APIErrorParser,
    private router: Router,
    private route: ActivatedRoute,
    private subscription: SubscriptionContainer,
    private store: LayoutStore,
    private layoutObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isServer = isPlatformServer(platformId);
  }

  ngOnInit() {
    this.navigationDefs = this.createNavByRoles(this.authAPI.me!.roles);
    this.setCurrentTree(this.route.snapshot);

    this.subscription.add(

      this.store.drawer.subscribe(drawer => {

        this.drawer = drawer;
        this.changeDetector.markForCheck();

      }),

      this.router.events.subscribe(event => {

        if (event instanceof NavigationEnd) {
          this.setCurrentTree(this.route.snapshot);
          this.changeDetector.markForCheck();
        }

      })

    );
  }

  ngAfterViewInit() {
    if (this.isServer) return;

    this.subscription.add(

      // to prevent header being overflowed(.layout-header-shrinked).
      fromEvent(window, 'resize').subscribe(() => this.changeDetector.markForCheck()),

      this.layoutObserver.observe([ '(max-width: 768px)' ]).subscribe(result => {
        if (result.matches) {

          if (this.drawerState === 'expanded') {
            this.markDrawerState('collapsed');
          }

        } else {

          if (this.drawerState === 'collapsed') {
            this.markDrawerState('expanded');
          }

        }
      })

    );
    this.changeDetector.detectChanges();

    setTimeout(() => this.swiperInstance.update()); // update after render
  }

  // no needs to navigate manually since parent component took care of auth states
  public async signOut() {
    if (this.processing) return;

    this.processing = true;

    try {

      await this.authAPI.signOut().toPromise();

    } catch (error) {

      this.errorParser.parse(error).subscribe(error => {

        this.flipBar.open(error.message);

      });

      return;
    } finally {

      this.processing = false;

    }

    this.inventorySwitch.dispose();
    this.flipBar.open(`${ this.user.username }님 안녕히가세요.`);
  }

  public shouldHeaderShrink() {
    if (this.isServer || !this.headerElRef?.nativeElement) { // for ssr and before view init

      return false;
    }

    /**
     * title and nav item's width can be retrieved like `getComputedStyle(el, '--side-width')`,
     * but changing css variable means application itself should be rebuilt.
     * remove unnecessary calculation for performance reason.
     * NOTE: This values should be updated with ./layout.component.scss
     */
    const
    headerWidth = this.headerElRef.nativeElement.getBoundingClientRect().width,
    titleWidth = 254,
    navItemWidth = 184,
    menuWidth = this.menuElRef!.nativeElement.getBoundingClientRect().width;

    return headerWidth - titleWidth - menuWidth < navItemWidth * this.navigationDefs.length;
  }

  public getCurrentNavIndex() {

    return this.navigationDefs.findIndex(nav => !!nav.tree && this.isCurrentTree(nav.tree));
  }

  // public toggleChildTree(node: Drawer) {
  //   this.expandedDrawerSet.has(node) ? this.expandedDrawerSet.delete(node) : this.expandedDrawerSet.add(node);
  //   this.changeDetector.markForCheck();
  // }

  public markDrawerState(state: DrawerState) {
    this.drawerState = state;
    this.changeDetector.markForCheck();
  }

  public isCurrentTree(tree: string[]) {

    return tree.every((node, i) => node === this.currentTree[i]);
  }

  public asSimple(node: Drawer) {

    return node as TreeNode;
  }

  public asRouter(node: Drawer) {

    return node as RouterLinkTreeNode;
  }

  public asOuter(node: Drawer) {

    return node as OuterLinkTreeNode;
  }

  public asAction(node: Drawer) {

    return node as ActionTreeNode;
  }

  private createNavByRoles(roles: UserRole[]) {
    const navDefs: RouterLinkDef[] = []

    if (roles.some(role => canManageUsers.includes(role as any))) {

      navDefs.push({ label: 'User', link: '/users', tree: [ 'users' ] });

    }

    if (roles.some(role => canWriteBlogArticle.includes(role as any))) {

      navDefs.push({ label: 'Blog', link: '/blog', tree: [ 'blog' ] });

    }

    return navDefs;
  }

  private setCurrentTree(snapshot: ActivatedRouteSnapshot) {
    this.currentTree = this.parseTreeData(snapshot);
    this.changeDetector.markForCheck();
  }

  private parseTreeData(snapshot: ActivatedRouteSnapshot) {
    const tree: string[] = []

    if (typeof snapshot.data.tree === 'string') {

      tree.push(snapshot.data.tree);

    }

    if (Array.isArray(snapshot.children) && snapshot.children.length) {

      for (const child of snapshot.children) {
        tree.push(...this.parseTreeData(child));
      }
      
    }

    return tree;
  }

}
