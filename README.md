# Tinyscroll.js

> 一个仿iphone风格的简易日历插件，目前仅支持触屏设备。

## 温馨提示

> 如果这个插件对你有帮助，请给予`star` :star: :up:


## 参数配置

- **title** (可选)

> 日历标题

- **wrapper**

> 包含日历插件的根元素

- **range**

> 日期区间，例如：['2010-08-01', '2015-08-01']

- **initDate** (可选)

> 初始日期，例如：'2012-08-01'

- **year** (可选)

> 设置`stateTree`状态树的`year`

- **month** (可选)

> 设置`stateTree`状态树的`month`

- **day** (可选)

> 设置`stateTree`状态树的`day`

----------------------------
###### *关于`stateTree`状态树：插件中的日历数据、动画、DOM调整全部通过`stateTree`控制，通过`setState`修改状态树的时候会触发`stateTree`的更新、DOM的更新以及页面重绘. *
----------------------------


## 使用方法

```js

var ts = new TinyScroll({
    title: 'tinyscroll.js demo',
    wrapper: '#container',
    range: ['1990', '2015'],
    initDate: '2000-02-20'
});

```

## 本地演示

```js

git clone https://github.com/FrendEr/tinyscroll.js.git
cd tinyscroll.js
open index.html

```
