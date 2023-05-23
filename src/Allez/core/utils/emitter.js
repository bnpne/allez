export default class emitter {
  constructor() {
    this.e = {};
  }

  // Subscribe to event
  on(name, callback, ctx) {
    // If no event of that name exists, create it
    // Push listener to name
    (!this.e[name] ? (this.e[name] = []) : this.e[name]).push({
      fn: callback,
      ctx: ctx,
    });
    return;
  }

  // Unsubscribe from event
  off(name) {
    // If event doesnt exist throw error
    // Remove object
    if (!this.e[name]) {
      console.error(`Event "${name}" does not exist.`);
      return;
    } else {
      delete this.e[name];
      return;
    }
  }

  // Emit an event
  emit(name) {
    // If event doesnt exist throw error
    // emit event
    if (!this.e[name]) {
      console.error(`Event "${name}" does not exist.`);
      return;
    } else {
      // Get Arguments
      let data = [].slice.call(arguments, 1);
      let evts = this.e[name].slice();
      evts.forEach((e) => e.fn.apply(e.ctx, data));
      return;
    }
  }
}
