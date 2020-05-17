# React-List-View

用于移动端，每次滑动到底部时，触发更新数据，然后可以继续往下查看

## 使用方法
```js
<ListView
    ref={el => this.lv = el}
    dataSource={this.state.dataSource}
    style={{ height: 200 }}
    renderHeader={() => <div style={{ height: 40 }}>Header</div>}
    renderSectionHeader={sectionData =>
        <div style={{ padding: 6, background: '#bbb' }}>{sectionData}</div>}
    renderRow={rowData => <div style={{ padding: 16 }}>{rowData}</div> }
    renderFooter={() => (<div style={{ padding: 20, background: '#e34' }}>
        {this.state.isLoading ? 'loading...' : 'loaded'}</div>)}
    onEndReached={this.onEndReached}
    onEndReachedThreshold={10}
    pageSize={10}
/>
```
`dataSource` 就是全部的数据，每次在 `this.onEndReached` 中请求到新数据后，需要把旧数据加上新数据放到 `this.state.dataSource` 中就可以了

具体可以查看`examples/ListViewExample`中的代码



## 原理
### 什么时候触发更新，判断条件是什么
  监听在父级元素的 `scroll` 事件，当到达底部的时候，就触发更新，获取到新的数据
  新的数据添加到之前旧的数据后面，然后返回给当前组件

  > 在移动端，父级元素可以就是 `window.body`，也可以在某个元素里面直接无限加载

  > 什么时候是达到底部，判断 `scrollTop` + `offsetHeight` 等于`scrollHeight` 的时候，这时候可以加个 `onEndReachedThreshold` 也就是距离底部还有多少距离的时候，就可以拉取新数据了

### 父元素的监听 `scroll` 事件，需要加上节流，也就是不要那么快的触发

  > 防抖debounce和节流throttle很像，这里做一下说明
  >
  > 防抖的场景如用户输入，需要对用户的输入做联想，这时候用户输入后，就发起请求，继续输入时，如果输入完后，当前还存在之前的请求，就取消掉，然后重新发起当前的请求。一般都是设置 `setTimeout` ，如果后续触发了事件，之前的 `setTimeout` 还在，就`cancelTimeout` 掉，重新发起一次``setTimeout`
  >
  >
  >
  > 节流的场景就是，类似`scroll` 这种事件，他是一定会高频发起，你需要控制他在某个事件内就只能发起一次，当前发起时，就设定某个标志位为 true，执行完当前事件后，设置为 false，在为true的这段时间，如果 `scroll` 事件继续触发，判断标志位为 true 时，就不会执行指定的函数了。

### 触发更新获取的数据，然后添加到当前页面中
  下拉到底部后，触发更新，这时候是全部的数据一起更新，就是拉取的新数据，加上之前的老数据，而不是只渲染新的数据，是的，阿里的[m-list-view](http://react-component.github.io/m-list-view) 就是这么做的，而且阿里的这个还是沿用的`facebook`的做法（他代码里说明了），所以感觉性能应该不是什么问题

### `onEndReached` 属性

  这个属性就是在判断到达底部的时候，触发 `props` 中的 `onEndReached` 这个函数，这个是用户用来拉取新的数据的，这个函数里需要做什么？

  1. 设置 `isLoading = true` 这时候就是在 `footer`底部用这个来显示是否在加载数据
  2. 每次在拉取新数据之前，需要判断一下是否可以拉取新数据，比如分页，最大的页数是10，那么在第10次的时候，检测到当前的 `page` 是 11，那就不用去拉取了
    3. 拉取新数据
    4. 将拉取的新数据和旧数据整合起来
    5. 将整和后的数据设置给`dataSource` 放到 `state` 中，然后设置`isLoading = false`
    6. 然后 `list-view` 就重新执行一次渲染

### 渲染的重点

  - `dataSource ` 就是全部的数据
  - `renderRow` 是渲染单个的数据
  - 在`list-view` 中需要从 `dataSource` 循环，每个数据都放到 `renderRow` 中，最后统一放到 `bodyComponents` 然后 `list-view` 中所有的列表数据就是这样渲染的
  - 这时候把`list-view` 中的 `renderHeader` 和`renderFooter` 加进来，就是所有的数据了

### 默认的数据格式，全部数据的格式

  在也就是`ListView`  属性中 `dataSource`中设置全部数据的格式，可以设置为一个二维数组，每次拉取都往里面添加一个一维数组

  ```js
  dataSource = [
    [
      { // 单个的 row 数据，也就是需要渲染的数据
  			name: 'xxx'
      }
    ]
  ]
  ```

### 渲染全部的数据，就是把`dataSource` 这样一个二维数组中的数据，里面的单个数据渲染成组件

  ```js
  renderBody = () => {
    const dataSource = this.props.dataSource;
    const bodyComponents = [];

    // 循环一个二维数组，在每一个数组中把数据加到 bodyComponents 中
    for (let sectionIdx = 0; sectionIdx < dataSource.length; sectionIdx++) {
      let curSection = dataSource[sectionIdx];
      let curSectionLength =  dataSource[sectionIdx].length;

      const sectionBody = [];
      for (let rowIdx = 0; rowIdx < curSectionLength; rowIdx++) {

        const row = this.props.renderRow(curSection[rowIdx]);
        sectionBody.push(row);
      }

      const rowsAndSeparators = React.cloneElement(
        this.props.renderSectionBodyWrapper(sectionIdx),
        {
          className: this.props.sectionBodyClassName,
        },
        sectionBody
      );

      // bodyComponents 可以直接 push(sectionBody)，如果每一组数据不需要样式上的分组的话
      bodyComponents.push(rowsAndSeparators);
    }

    return bodyComponents;
  }
  ```

### 最核心的代码

  ```js
  _onScroll = (e, metrics) => {
    // ...
    // scroll的时候，检测到了可以触发更新的距离了
    if (this._isSafetyDistanceToCall(metrics)) {
      this.props.onEndReached(e);
    }

     this.props.onScroll && this.props.onScroll(e);
  }

  _isSafetyDistanceToCall = (scrollProperties) => {
    let distanceFromEnd = scrollProperties.contentLength -
        scrollProperties.visibleLength - scrollProperties.offset;
    return distanceFromEnd < this.props.onEndReachedThreshold;
  }

  // scrollProperties
  getMetrics = () => {
      const isVertical = !this.props.horizontal;
      if (this.props.useBodyScroll) {
          // In chrome61 `document.body.scrollTop` is invalid,
          // and add new `document.scrollingElement`(chrome61, iOS support).
          // In old-android-browser and iOS `document.documentElement.scrollTop` is invalid.
          const scrollNode = document.scrollingElement ? document.scrollingElement : document.body;
          // todos: Why sometimes do not have `this.ScrollViewRef` ?
          return {
              visibleLength: window[isVertical ? 'innerHeight' : 'innerWidth'],
              contentLength: this.ScrollViewRef ?
                  this.ScrollViewRef[isVertical ? 'scrollHeight' : 'scrollWidth'] : 0,
              offset: scrollNode[isVertical ? 'scrollTop' : 'scrollLeft'],
          };
      }

      return {
          visibleLength: this.ScrollViewRef[isVertical ? 'offsetHeight' : 'offsetWidth'],
          contentLength: this.ScrollViewRef[isVertical ? 'scrollHeight' : 'scrollWidth'],
          offset: this.ScrollViewRef[isVertical ? 'scrollTop' : 'scrollLeft'],
      };
  }

  ```

## 参考
[m-list-view](https://github.com/react-component/m-list-view)
> 其实代码就是从这里摘出来的，这个功能有点多，代码繁琐，我想要的就是一个能够滑动到底部，就能够拉取数据继续渲染的组件

吐个槽，花了周末两天时间才把所有的，我不需要的代码删除了，我摘出来的代码，看懂简直不需要半个小时
而且`m-list-view` 这个组件在使用的时候，还需要
```js
const getSectionData = (dataBlob, sectionID) => dataBlob[sectionID];
const getRowData = (dataBlob, sectionID, rowID) => dataBlob[rowID];

const dataSource = new ListView.DataSource({
  getRowData,
  getSectionHeaderData: getSectionData,
  rowHasChanged: (row1, row2) => row1 !== row2,
  sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
});
```

我就是需要一个当前页的数据加载，然后滑动到底部，然后下载下一页，为什么我还需要关注`rowHasChanged`和`getRowData` 这种东西

