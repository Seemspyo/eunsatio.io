import {
  ComponentPortal,
  ComponentType,
  Portal,
  TemplatePortal
} from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Injectable,
  Injector,
  OnInit,
  Optional,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import {
  FlipBarOption,
  FLIP_BAR_CONTENT,
  FLIP_BAR_DEFAULT_OPTIONS
} from './@flip-bar';
import { VOID } from '@eunsatio.io/util/dist/void';
import { Overlay } from '@angular/cdk/overlay';


@Component({
  selector: 'flip-bar',
  templateUrl: 'flip-bar.html',
  styleUrls: [ 'flip-bar.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'flip-bar-container'
  }
})
export class FlipBarComponent implements OnInit {

  public portal: Portal<any>|null = null;

  constructor(
    @Inject(FLIP_BAR_CONTENT) public content: string | ComponentType<any> | TemplateRef<any>,
    private viewRef: ViewContainerRef,
    public options: FlipBarOption
  ) { }

  ngOnInit() {
    if (this.content instanceof TemplateRef) {

      this.portal = new TemplatePortal(this.content, this.viewRef, this.options.data);

    } else if (typeof this.content !== 'string') {

      this.portal = new ComponentPortal(this.content, null, Injector.create({ providers: this.options.data }));

    }
  }

}

@Injectable()
export class FlipBar {

  private clearPrevOverlay = VOID;

  constructor(
    private overlay: Overlay,
    private injector: Injector,
    @Optional() @Inject(FLIP_BAR_DEFAULT_OPTIONS) private defaultOptions?: FlipBarOption
  ) { }

  public open<T>(component: ComponentType<T>, options?: FlipBarOption): () => void;
  public open<T>(template: TemplateRef<T>, options?: FlipBarOption): () => void;
  public open<T>(content: string, options?: FlipBarOption): () => void;
  public open<T>(content: ComponentType<T> | TemplateRef<T> | string, options?: FlipBarOption) {
    this.clearPrevOverlay();

    options = { ...new FlipBarOption(), ...this.defaultOptions, ...options }

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        {
          provide: FLIP_BAR_CONTENT,
          useValue: content
        },
        {
          provide: FlipBarOption,
          useValue: options
        }
      ]
    });

    const portal = new ComponentPortal(FlipBarComponent, null, injector);

    const position = this.overlay.position().global();

    switch (options.alignX) {
      case 'left':
      case 'right':
        position[options.alignX]();
        break;
      case 'center':
        position.centerHorizontally();
        break;
      default:
        position.left(`${ options.alignX! * 100 }%`);
    }

    switch (options.alignY) {
      case 'top':
      case 'bottom':
        position[options.alignY]();
        break;
      case 'center':
        position.centerVertically();
        break;
      default:
        position.top(`${ options.alignY! * 100 }%`);
    }

    const overlayRef = this.overlay.create({ positionStrategy: position });

    overlayRef.attach(portal);

    const timeout = setTimeout(() => {
      overlayRef.dispose();
    }, options.duration);

    const clear = this.clearPrevOverlay = () => {
      clearTimeout(timeout);
      overlayRef.dispose();
      this.clearPrevOverlay = VOID;
    }

    return clear;
  }

}
