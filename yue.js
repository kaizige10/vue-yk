// 创建vue实例
// new Yue({
//   data() {
//     return {
//       msg: "hello yangkai"
//     }
//   },
// })

class Yue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;
    this.$methods = options.methods;

    this.observer(this.$data);
    this.proxyData(this.$data);
    this.proxyMethod(this.$methods);

    // 测试dep和watcher
    // new Watcher(this, 'test')
    // console.log('this.test',this.test);

    // new Watcher(this, 'foo')
    // console.log('this.foo.bar', this.foo.bar);

    new Compile(this, options.el);

    if (typeof options.created === 'function') {
      options.created.call(this);
    }
  }

  observer(data) {
    // console.log('observer', data);
    // 数据不存在或者不是对象，则无法监听
    if (!data || typeof data !== "object") return;

    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key]);
    });
  }

  defineReactive(data, key, value) {
    // console.log('defineReactive', key, value);
    this.observer(value);

    const dep = new Dep();

    Object.defineProperty(data, key, {
      get() {
        Dep.target && dep.addDep(Dep.target);
        return value;
      },
      set(newValue) {
        if (value === newValue) return;
        value = newValue;
        // console.log(key + '的value 更新了：', value);
        dep.notify();
      }
    })
  }

  proxyData(data) {
    // console.log('proxyData', data);

    if (!data || typeof data !== "object") return;
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return this.$data[key];
        },
        set(val) {
          this.$data[key] = val;
        }
      })
    });
  }

  proxyMethod(methods) {
    Object.keys(methods).forEach(name => {
      Object.defineProperty(this, name, {
        get() {
          return this.$methods[name];
        },
        set(val) {
          this.$methods[name] = val;
        }
      })
    });
  }
}

class Dep {
  constructor() {
    this.deps = [];
  }

  addDep(dep) {
    this.deps.push(dep)
  }

  notify() {
    this.deps.forEach(dep => dep.update());
  }
}

class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    // 每创建一个Watcher实例时，都将该实例赋值给Dep.target，在get中可以用到
    Dep.target = this;
    this.vm[this.key];
    Dep.target = null;
  }

  update() {
    // console.log(`属性${this.key}更新了`);
    this.cb.call(this.vm, this.vm[this.key]);
  }
}