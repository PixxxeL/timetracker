import React from 'react';

import { formatMilliseconds } from '../../utils/text';


class Timer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            startDate : null,
            diff : 0
        };
        this.loopCounter = 0;
        this.curDesc = '';
        this.toggle = this._toggle.bind(this);
        this._renderFrame = this._renderFrame.bind(this);
    }

    render() {
        const css = this.state.startDate ? 'fa fa-pause' : 'fa fa-play';
        return <div className="timer-container">
            <a href="#" title="Таймер" className="btn" onClick={this.toggle}>
                <i className={css}></i>
            </a>
            <a href="#" title="Таймер" className="label" onClick={this.toggle}>
                {formatMilliseconds(this.state.diff)}
            </a>
            <div className="total-time">
                Всего времени в проекте: <span className="total value">0:00:00</span>
                <br/>
                не учтенного: <span className="opened value">0:00:00</span>
            </div>
        </div>;
    }

    _toggle(e) {
        e.preventDefault();
        let startDate = null,
            insertTime = false;
        if (!this.state.startDate) {
            startDate = new Date;
            insertTime = true
            this.loopCounter = 0;
            this.curDesc = window.prompt('Можете ввести пояснение:', '').trim()
            window.requestAnimationFrame(this._renderFrame);
        }
        this.setState({
            startDate : startDate
        }, () => {
            this._saveTimer(insertTime);
        });
    }

    _renderFrame() {
        if (this.state.startDate) {
            let diff = new Date().getTime() - this.state.startDate.getTime();
            this.setState({
                diff : diff
            });
            if (++this.loopCounter % 100 === 0) { // per 5 seconds
                this._saveTimer();
            }
            window.requestAnimationFrame(this._renderFrame);
        }
    }

    _saveTimer(insert=false) {
        /*const startTs = this.state.startDate.getTime();
        const timeItem = {
            startTs : startTs,
            endTs : new Date().getTime(),
            desc : this.curDesc,
            closed : false
        };
        this.props.setNewDate(timeItem, startTs, insert);*/
    }

}

export default Timer;
