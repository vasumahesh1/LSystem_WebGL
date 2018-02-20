// Taken From
// https://gist.github.com/beachmountain/929ba1cea0b43559e531
class Stack<T> {
  top: any;

  constructor() {
    this.top = undefined;
  }

  push(value: T): void {
    this.top = {
      value: value,
      next: this.top
    };
  }

  pop(): T {
    let value: T = this.top.value;
    this.top = this.top.next;
    return value;
  }

  peek(): T {
    return this.top.value;
  }

  isEmpty(): boolean {
    return this.top === undefined;
  }
};

export default Stack;