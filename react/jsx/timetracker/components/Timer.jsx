import React from 'react';

import { formatMilliseconds } from '../../utils/text';


class Timer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            newTime : null,
            diff : 0
        };
        this.loopCounter = 0;
        this.toggle = this._toggle.bind(this);
        this._renderFrame = this._renderFrame.bind(this);
    }

    render() {
        const css = this.state.newTime ? 'fa fa-pause' : 'fa fa-play';
        let total = 0, closed = 0;
        this.props.times.forEach(time => {
            let diff = time.endTs - time.startTs;
            total += diff;
            if (time.closed) {
                closed += diff;
            }
        });
        return <div className="timer-container">
            <a href="#" title="Таймер" className="btn" onClick={this.toggle}>
                <i className={css}></i>
            </a>
            <a href="#" title="Таймер" className="label" onClick={this.toggle}>{
                formatMilliseconds(this.state.diff)
            }</a>
            <div className="total-time">
                Всего времени в проекте: <span className="total value">{
                    formatMilliseconds(total)
                }</span>
                <br/>
                не учтенного: <span className="opened value">{
                    formatMilliseconds(closed)
                }</span>
            </div>
        </div>;
    }

    _toggle(e) {
        e.preventDefault();
        let newTime = null;
        if (this.state.newTime) {
            this.props.newTimeItem(this.state.newTime);
            this.props.lock(false);
        } else {
            this.loopCounter = 0;
            const now = new Date().getTime();
            newTime = {
                startTs : now,
                endTs : now,
                desc : window.prompt('Можете ввести пояснение:', '').trim(),
                closed : false
            };
            this.props.newTimeItem(newTime);
            this.props.lock(true);
            window.requestAnimationFrame(this._renderFrame);
        }
        this.setState({
            newTime : newTime,
            diff : 0
        });
    }

    _renderFrame() {
        if (!this.state.newTime) {
            return;
        }
        const newTime = this.state.newTime;
        newTime.endTs = new Date().getTime();
        this.setState({
            diff : newTime.endTs - newTime.startTs,
            newTime : newTime
        });
        if (++this.loopCounter % 30 === 0) { // per 0.5 seconds
            this.props.newTimeItem(newTime);
        }
        window.requestAnimationFrame(this._renderFrame);
    }

}

export default Timer;
