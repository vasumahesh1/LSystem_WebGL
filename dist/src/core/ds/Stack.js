// Taken From
// https://gist.github.com/beachmountain/929ba1cea0b43559e531
class Stack {
    constructor() {
        this.top = undefined;
    }
    push(value) {
        this.top = {
            value: value,
            next: this.top
        };
    }
    pop() {
        let value = this.top.value;
        this.top = this.top.next;
        return value;
    }
    peek() {
        return this.top.value;
    }
    isEmpty() {
        return this.top === undefined;
    }
}
;
export default Stack;
//# sourceMappingURL=Stack.js.map