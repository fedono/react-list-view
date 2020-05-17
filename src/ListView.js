import React from 'react';
import ScrollView from './ScrollView';

const DEFAULT_END_REACHED_THRESHOLD = 1000;
const DEFAULT_SCROLL_CALLBACK_THROTTLE = 50;

export default class ListView extends React.Component {

    static defaultProps = {
        renderScrollComponent: props => <ScrollView {...props} />,
        renderBodyComponent: () => <div />,
        renderSectionBodyWrapper: (sectionID) => <div key={sectionID} />,
        sectionBodyClassName: 'list-view-section-body',
        listViewPrefixCls: 'rmc-list-view',
        onEndReachedThreshold: DEFAULT_END_REACHED_THRESHOLD,
        scrollEventThrottle: DEFAULT_SCROLL_CALLBACK_THROTTLE
    }

    renderBody = () => {
        const dataSource = this.props.dataSource;
        const bodyComponents = [];

        // 循环dataSource这个二维数组，在每一个数组中把数据加到 bodyComponents 中
        for (let sectionIdx = 0; sectionIdx < dataSource.length; sectionIdx++) {
            let curSection = dataSource[sectionIdx];
            let curSectionLength =  dataSource[sectionIdx].length;

            const sectionBody = [];
            for (let rowIdx = 0; rowIdx < curSectionLength; rowIdx++) {

                const row = this.props.renderRow(curSection[rowIdx]);
                sectionBody.push(row);
            }

            // 这个纯粹是为了，如果每一组数据需要在样式上做区分，就需要用这个来包裹 sectionBody
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

    render() {
        const {renderScrollComponent, ...props} = this.props;

        return React.cloneElement(
            renderScrollComponent({...props, onScroll: this._onScroll}),
            {
                ref: el => this.ListViewRef = el
            },
            this.props.renderHeader ? this.props.renderHeader() : null,
            React.cloneElement(props.renderBodyComponent(), {}, this.renderBody()),
            this.props.renderFooter ? this.props.renderFooter() : null
        );
    }

    _onScroll = (e, metrics) => {
        // when the ListView is destroyed,
        // but also will trigger scroll event after `scrollEventThrottle`
        if (!this.ListViewRef || !this.props.onEndReached) {
            return;
        }

        // 到了可以触发更新的距离了
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
}
