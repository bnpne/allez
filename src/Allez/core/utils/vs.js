import emitter from "./emitter";

const SCROLL = "vs";

export default class VS {
  constructor(options) {
    this.el = window;
    if (options && options.el) {
      this.el = options.el;
      delete options.el;
    }
    this.hasWheelEvent = "onwheel" in document;

    this.options = Object.assign(
      {
        mouseMultiplier: 1,
        touchMultiplier: 2,
        firefoxMultiplier: 15,
        keyStep: 120,
        preventTouch: false,
        unpreventTouchClass: "vs-touchmove-allowed",
        useKeyboard: true,
        useTouch: true,
      },
      options
    );

    this.em = new emitter();
    this.scroll = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
    };
  }

  notify(e) {
    let v = this.scroll;
    v.x += v.deltaX;
    v.y += v.deltaY;

    this.em.emit(SCROLL, {
      x: v.x,
      y: v.y,
      deltaX: v.deltaX,
      deltaY: v.deltaY,
      originalEvent: e,
    });
  }

  onWheel(e) {
    let options = this.options;
    let v = this.scroll;

    v.deltaX = e.wheelDeltaX || e.deltaX * -1;
    v.deltaY = e.wheelDeltaY || e.deltaY * -1;

    // TODO firefox

    v.deltaX *= options.mouseMultiplier;
    v.deltaY *= options.mouseMultiplier;

    this.notify(e);
  }

  bind() {
    if (this.hasWheelEvent) {
      this.el.addEventListener("wheel", this.onWheel.bind(this));
    }
  }

  unbind() {
    if (this.hasWheelEvent) {
      this.el.removeEventListener("wheel", this.onWheel.bind(this));
    }
  }

  on(callback, ctx) {
    this.em.on(SCROLL, callback, ctx);

    let events = this.em.e;
    if (events && events[SCROLL] && events[SCROLL].length === 1) {
      this.bind();
    }
  }

  off() {
    this.em.off(SCROLL);

    let events = this.em.e;
    if (!events[SCROLL] || events[SCROLL].length <= 0) {
      this.unbind();
    }
  }

  destroy() {
    this.em.off();
    this.unbind();
  }
}
