import React from 'react';

import TimeRow from './TimeRow.jsx'


class Times extends React.Component {

    render() {
        const times = this.props.data[this.props.current];
        return <div className="times">
            {
                times.length ?
                <table className="results">
                    <thead>
                        <tr>
                            <th>Учтено</th>
                            <th>Начало</th>
                            <th>Завершение</th>
                            <th>Пояснение</th>
                            <th>Всего</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>{
                        times.map((time, idx) => <TimeRow
                            key={idx}
                            time={time}
                            close={this.props.close}
                            remove={this.props.remove}
                        />)
                    }</tbody>
                </table> :
                <div className="empty">Пока нет учтенного времени</div>
            }
        </div>;
    }

}

export default Times;
