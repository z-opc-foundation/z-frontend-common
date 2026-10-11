import { Component } from 'react'
import { Button, Result } from 'antd'

/**
 * 兜底错误边界（0.1.1 契约保留）：render 崩了显示错误 + 重置按钮。
 * props: children + 可选 onReset（点「重试」时回调，缺省只清内部态）。
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
        this.handleReset = () => {
            this.setState({ hasError: false, error: null, errorInfo: null })
            typeof this.props.onReset === 'function' && this.props.onReset()
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] caught error:', error, info)
        this.setState({ errorInfo: info })
    }

    render() {
        if (this.state.hasError) {
            return (
                <Result
                    status="error"
                    title="页面出错了"
                    subTitle={String(this.state.error?.message || this.state.error)}
                    extra={<Button type="primary" onClick={this.handleReset}>重试</Button>}
                />
            )
        }
        return this.props.children
    }
}
