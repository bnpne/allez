import VS from "./utils/vs";
import { lerp } from "./utils/math";
import { getTranslate } from "./utils/transform";

const defaults = {
  el: document,
  smooth: true,
  direction: "vertical",
  context: "desktop",
  namespace: "allez",
  selector: "allez",
  lerp: 0.1,
  initPosition: { x: 0, y: 0 },
  multiplier: 0.5,
};

export default class {
  constructor(
    options = {
      el: document,
      smooth: false,
      direction: "vertical",
      context: "desktop",
      namespace: "allez",
      selector: "allez",
      lerp: 0.1,
      initPosition: { x: 0, y: 0 },
      multiplier: 0.5,
    }
  ) {
    Object.assign(this, defaults, options);
    if (history.scrollRestoration) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    this.html = document.documentElement;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    this.windowMiddle = {
      x: this.windowWidth / 2,
      y: this.windowHeight / 2,
    };
    this.elements = {};
    this.currentElements = {};
    this.isScrolling = false;
    this.stop = false;

    this.instance = {
      delta: {
        x: this.initPosition.x,
        y: this.initPosition.y,
      },
      scroll: {
        x: this.initPosition.x,
        y: this.initPosition.y,
      },
      limit: {
        x: this.html.offsetWidth,
        y: this.html.offsetHeight,
      },
      currentElements: this.currentElements,
      direction: this.direction,
      speed: 0,
    };

    this.checkScroll = this.checkScroll.bind(this);
    this.resize = this.resize.bind(this);

    window.addEventListener("resize", this.resize);

    // Start this shit
    this.init();
  }

  init() {
    // Set default styles
    this.html.style.overflow = "hidden";
    this.html.style.overscrollBehavior = "none";

    this.vs = new VS({
      el: this.el,
    }).on((e) => {
      if (this.stop) {
        return;
      }

      requestAnimationFrame(() => {
        this.updateDelta(e);
        !this.isScrolling && this.startScrolling();
      });
    });

    this.addElements();
    this.setScrollLimit();
    this.detectElements();
    this.checkScroll();
    this.transformElements();
  }

  setScrollLimit() {
    this.instance.limit.y = this.html.offsetHeight - this.windowHeight;
  }

  startScrolling() {
    this.deltaTime = Date.now();

    this.isScrolling = true;
    this.checkScroll();
    this.html.classList.add("is-scrolling");
  }

  stopScrolling() {
    cancelAnimationFrame(this.scrollLoop);
    this.deltaTime = undefined;

    this.isScrolling = false;
    this.instance.scroll.y = Math.round(this.instance.scroll.y);
    this.html.classList.remove("is-scrolling");
  }

  checkScroll() {
    if (this.isScrolling) {
      this.scrollLoop = requestAnimationFrame(() => this.checkScroll());
      this.updateScroll();
      const distance = Math.abs(this.instance.delta.y - this.instance.scroll.y);
      const timestamp = Date.now() - this.deltaTime;
      if (
        timestamp > 100 &&
        ((distance < 0.5 && this.instance.delta.y !== 0) ||
          (distance < 0.5 && this.instance.delta.y === 0))
      ) {
        this.stopScrolling();
      }

      console.log(this.instance);

      this.detectElements();
      this.transformElements();
    }
    const scrollEvent = new Event(this.namespace + "scroll");
    this.el.dispatchEvent(scrollEvent);
  }

  updateDelta(e) {
    let delta = e.deltaY;

    this.instance.delta.y -= delta * this.multiplier;
    if (this.instance.delta.y < 0) this.instance.delta.y = 0;
    if (this.instance.delta.y > this.instance.limit.y) {
      this.instance.delta.y = this.instance.limit.y;
    }
  }

  updateScroll(e) {
    if (this.isScrolling) {
      if (this.smooth) {
        this.instance.scroll.y = lerp(
          this.instance.scroll.y,
          this.instance.delta.y,
          this.lerp
        );
      } else {
        this.instance.scroll.y = this.instance.delta.y;
      }
    } else {
      if (this.instance.scroll.y > this.instance.limit.y) {
        this.setScroll(this.instance.scroll.y, this.instance.limit.y);
      } else if (this.instance.scroll.y < 0) {
        this.setScroll(this.instance.scroll.y, 0);
      } else {
        this.setScroll(this.instance.scroll.y, this.instance.delta.y);
      }
    }
  }

  setScroll(x, y) {
    this.instance = {
      ...this.instance,
      scroll: { x: x, y: y },
      delta: { x: x, y: y },
    };
  }

  addElements() {
    this.elements = {};

    const parents = this.el.querySelectorAll(`[${this.selector}-scroll]`);
    parents.forEach((parent) => {
      Array.from(parent.children).forEach((element, i) => {
        let dims = {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          middle: { x: 0, y: 0 },
          progress: 0,
        };

        const rect = element.getBoundingClientRect();
        dims.top = rect.top + this.instance.scroll.y - getTranslate(element).y;
        dims.left =
          rect.left + this.instance.scroll.x - getTranslate(element).x;
        dims.bottom = dims.top + element.offsetHeight;
        dims.right = dims.left + element.offsetWidth;
        dims.middle = {
          x: (dims.right - dims.left) / 2 + dims.left,
          y: (dims.bottom - dims.top) / 2 + dims.top,
        };
        let id = `el-${i}`;

        // todo: add speed option
        const mapped = {
          id: id,
          element,
          dims: dims,
          inView: false,
        };

        this.elements[id] = mapped;
      });
    });
  }

  detectElements() {
    const scrollTop = this.instance.scroll.y;
    const scrollBottom = this.instance.scroll.y + this.windowHeight;

    Object.values(this.elements).forEach((element) => {
      const { top, bottom } = element.dims;

      if (element && !element.inView) {
        if (scrollTop < bottom && scrollBottom >= top) {
          this.setInView(element, element.id);
        }
      }

      if (element && element.inView) {
        let height = bottom - top;
        element.dims.progress =
          (this.instance.scroll.y - (top - this.windowHeight)) /
          (height + this.windowHeight);

        if (scrollTop > bottom || scrollBottom < top) {
          this.setOutOfView(element, element.id);
        }
      }
    });
  }

  setInView(element, index) {
    this.elements[index].inView = true;
    this.currentElements[index] = element;

    this.elements[index].element.style.opacity = "1";

    // todo:
    // make an event call when it enters the viewport
  }

  setOutOfView(element, index) {
    this.elements[index].inView = false;

    Object.keys(this.currentElements).forEach((el) => {
      el === index && delete this.currentElements[el];
    });

    this.elements[index].element.style.opacity = "0";
    // todo:
    // make an event call when it exits the viewport
  }

  transformElements() {
    const scrollMiddle = {
      x: this.instance.scroll.x + this.windowMiddle.x,
      y: this.instance.scroll.y + this.windowMiddle.y,
    };

    Object.entries(this.instance.currentElements).forEach(
      ([index, element]) => {
        // add speed option maybe
        let distance = -this.instance.scroll.y;

        if (element.inView) {
          if (distance) {
            let transform = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,0,${distance},0,1)`;

            element.element.style.webkitTransform = transform;
            element.element.style.msTransform = transform;
            element.element.style.transform = transform;
          }
        }
      }
    );
  }

  resize() {
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;

    this.windowMiddle = {
      x: this.windowWidth / 2,

      y: this.windowHeight / 2,
    };
    this.update();
  }

  update() {
    this.setScrollLimit();
    this.addElements();
    this.detectElements();
    this.updateScroll();
    this.transformElements();
    this.checkScroll();
  }

  destroy() {
    this.stopScrolling();
    this.vs.destroy();
    window.removeEventListener("resize", this.checkResize, false);
  }
}
