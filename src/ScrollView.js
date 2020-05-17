import React from 'react';
import cx from 'classnames';
import { throttle } from './util';

export default class ScrollView extends React.Component {
    componentDidMount() {
        let handleScroll = e => this.props.onScroll && this.props.onScroll(e, this.getMetrics());

        // 加个节流函数
        if (this.props.scrollEventThrottle) {
            handleScroll = throttle(handleScroll, this.props.scrollEventThrottle);
        }
        this.handleScroll = handleScroll;

        // 是在 window.body 在监听还是在元素上监听
        if (this.props.useBodyScroll) {
            window.addEventListener('scroll', this.handleScroll);
        } else {
            this.ScrollViewRef.addEventListener('scroll', this.handleScroll);
        }
    }

    componentWillUnmount() {
        if (this.props.useBodyScroll) {
            window.removeEventListener('scroll', this.handleScroll);
        } else {
            this.ScrollViewRef.removeEventListener('scroll', this.handleScroll);
        }
    }

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

    render() {
        const {
            children, className, prefixCls, listPrefixCls, listViewPrefixCls,
            style = {}, contentContainerStyle = {}, useBodyScroll
        } = this.props;

        const styleBase = {
            position: 'relative',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
        };

        const preCls = prefixCls || listViewPrefixCls || '';

        const containerProps = {
            ref: el => this.ScrollViewRef = el || this.ScrollViewRef,
            style: { ...(useBodyScroll ? {} : styleBase), ...style },
            className: cx(className, `${preCls}-scrollview`),
        };

        const contentContainerProps = {
            ref: el => this.InnerScrollViewRef = el,
            style: { position: 'absolute', minWidth: '100%', ...contentContainerStyle },
            className: cx(`${preCls}-scrollview-content`, listPrefixCls),
        };

        // useBodyScroll 这个属性，是决定是否挂载在 window.body 上，还是在某个元素内部进行滚动查看数据
        if (useBodyScroll) {
            return (
                <div {...containerProps}>
                    {children}
                </div>
            );
        }

        return (
            <div {...containerProps}>
                <div {...contentContainerProps}>
                    {children}
                </div>
            </div>
        );
    }
}
