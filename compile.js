class Compile {
  constructor(vm, el) {
    this.$vm = vm;
    this.$el = document.querySelector(el);

    if (this.$el) {
      // 把$el的内容先放到文档片段中，这样可以提升效率
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译，替换动态内容
      this.compile(this.$fragment);
      // 重新放回$el中
      this.$el.appendChild(this.$fragment);
    }
  }

  node2Fragment(el) {
    const fragment = document.createDocumentFragment();
    let child;
    while ((child = el.firstChild)) {
      fragment.appendChild(child)
    }
    return fragment;
  }

  // 递归遍历el，分别处理元素节点和插值表达式
  compile(fragment) {
    const childNodes = fragment.childNodes;
    Array.from(childNodes).forEach(node => {
      if (this.isElement(node)) {
        // 编译元素节点
        // console.log('编译元素节点', node.nodeName);
        this.compileElement(node);
      } else if (this.isInterpolation(node)) {
        // 编译插值文本
        // console.log('编译插值文本', node.textContent);
        this.compileText(node);
      }
      if (node.hasChildNodes()) {
        this.compile(node);
      }
    })
  }

  isElement(node) {
    return node.nodeType === 1;
  }

  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }
  
  compileText(node) {
    // console.log(RegExp.$1);
    // node.textContent = this.$vm.$data[RegExp.$1];
    // 编写更新函数，创建Watcher，实现真正的依赖收集
    const exp = RegExp.$1;
    this.update(node, this.$vm, exp, "text");
  }

  compileElement(node) {
    // 获取节点属性
    let nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach(attr => {
      let attrName = attr.name;// 属性名称
      let exp = attr.value;// 属性值（表达式）
      if (this.isDirective(attrName)) {
        let dir = attrName.substr(2);
        // 执行指令解析
        this[dir] && this[dir](node, this.$vm, exp);
      } else if (this.isEvent(attrName)) {
        let eventName = attrName.substr(1);
        // console.log('事件名：', eventName, exp);
        this.registEvent(node, eventName, exp, this.$vm);
      }
    })
  }

  registEvent(node, eventName, exp, vm) {
    node.addEventListener(eventName, vm[exp].bind(vm));
  }

  isEvent(attrName) {
    return attrName.startsWith("@");
  }

  isDirective(attrName) {
    return attrName.startsWith("y-");
  }

  text(node, vm, exp) {
    this.update(node, vm, exp, "text");
  }

  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }

  model(node, vm, exp) {
    
    // 注册input事件
    node.addEventListener("input", (e) => vm[exp] = e.target.value);
    
    this.update(node, vm, exp, "value");
  }

  update(node, vm, exp, dir) {
    let updateFn = this[dir + "Updater"];
    updateFn && updateFn(node, vm[exp]);

    new Watcher(vm, exp, function (value) {
      updateFn && updateFn(node, value);
    })
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  valueUpdater(node, value) {
    node.value = value;
  }
}