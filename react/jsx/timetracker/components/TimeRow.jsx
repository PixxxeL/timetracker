import React from 'react';

import { formatMilliseconds } from '../../utils/text';


class TimeRow extends React.Component {

    constructor(props) {
        super(props);
        this.close = this._close.bind(this);
        this.remove = this._remove.bind(this);
    }

    render() {
        const time = this.props.time;
        const start = new Date(time.startTs).toLocaleString();
        const end = new Date(time.endTs).toLocaleString();
        const diff = time.endTs - time.startTs;
        let css = time.closed ? 'closed' : '';
        return <tr>
            <td><input
                type="checkbox"
                className="closer"
                checked={time.closed}
                onChange={this.close}
            /></td>
            <td className={css}>{start}</td>
            <td className={css}>{end}</td>
            <td className={`${css} m-hidden`}>{time.desc}</td>
            <td className={css}>{formatMilliseconds(diff)}</td>
            <td>
                <a href="#" className="clear-btn" title="Удалить" onClick={this.remove}>
                    <i className="fa fa-remove" />
                </a>
            </td>
        </tr>;
    }

    _close(e) {
        this.props.close(this.props.time.startTs, e.target.checked);
    }

    _remove(e) {
        e.preventDefault();
        this.props.remove(this.props.time.startTs);
    }

}

export default TimeRow;
