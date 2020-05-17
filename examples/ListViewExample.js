import React from 'react';
import ListView from '../src/ListView';

const NUM_ROWS_PER_SECTION = 5;
// 全局的属性，初始时0.比如分页，那么在最大页数是10的时候，在pageIndex++ 为11 的时候，就不用去拉取了
let pageIndex = 0;
// 所有的数据，因为list-view 是每次都会渲染所有的数据，所以需要一个全局变量来保存所有的数据
const dataBlobs = [];
// demo 中用来生成每次的新数据
function genData(pIndex = 0) {
    dataBlobs[pIndex] = [];

    for (let jj = 0; jj < NUM_ROWS_PER_SECTION; jj++) {
        const rowName = `P${pIndex}, R${jj}`;
        dataBlobs[pIndex].push(rowName);
    }
}

export default
class ListViewExample extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dataSource: dataBlobs,
            isLoading: true,
        };
    }

    componentDidMount() {
        document.body.style.overflowY =
            navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) ? 'hidden' : 'auto';

        // simulate initial Ajax
        setTimeout(() => {
            genData();
            this.setState({
                dataSource: dataBlobs,
                isLoading: false,
            });
        }, 600);
    }

    onEndReached = () => {
        // load new data
        // hasMore: from backend data, indicates whether it is the last page, here is false
        if (this.state.isLoading && !this.state.hasMore) {
            return;
        }
        this.setState({ isLoading: true });
        setTimeout(() => {
            genData(++pageIndex);
            this.setState({
                dataSource: dataBlobs,
                isLoading: false,
            });
        }, 1000);
    }

    render() {
        return (
            <div style={{ border: '1px solid #ccc', margin: 10 }}>
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
            </div>
        );
    }
}
