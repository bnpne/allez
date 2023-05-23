import "./styles/main.scss";
import Allez from "./Allez";

class App {
  constructor() {
    this.allez = new Allez({
      smooth: true,
      multiplier: 1,
    });
    this.init();
  }

  init() {
    // console.log(this.allez.instance.scroll);
  }
}

new App();
