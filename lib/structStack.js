/*
JS栈结构的简单封装
https://zhuanlan.zhihu.com/p/113801689
*/

class Stack {
    constructor() {
        this.items = [];
    }
    push(element) {
	    this.items.push(element);
    }
    pop() {
	    return this.items.pop();
    }
    peek() {
        return this.items[this.items.length - 1];
    }
    isEmpty() {
	    return !this.items.length;
    }
    clear() {
	    this.items = [];
    }
    size() {
	    return this.items.length;
    }
}

module.exports = Stack;